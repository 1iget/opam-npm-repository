open Nethttp_client
open Yojson.Basic
open Yojson.Basic.Util

module StringSet = Set.Make( 
  struct
    let compare = String.compare
    type t = string
  end )

type maintainer = {
  name: string;
  email: string;
}

type dep = {
  package: string;
  range: string;
}

type version = {
  tarball: string;
  deps: dep list;
  maintainer: maintainer;
  license: string;
  dev_repo: string option;
  description: string option;
}

type doc = { 
  versions: (string * version) list;
  id: string;
}

let string_of_option opt =
  match opt with
  | Some x -> x
  | None -> "null"



let flip f a b = f b a

(*URLs to connect to a local CouchDB replica of the NPM registry*)
let url_doc = "http://localhost:5984/registry/_all_docs?include_docs=true&limit=3"
(*let search_url_doc id =*)
  (*Printf.sprintf "http://localhost:5984/registry/%s?include_docs=true" id*)

let search_url_doc id =
  Printf.sprintf "http://localhost:5984/registry/_design/versions_fixed/_view/all?key=\"%s\"" id

let concat_ands v =
  if v = [] then "foo" else
  String.concat " , " (
    List.map (fun v ->
      if v = "" then "foo" 
      else Printf.sprintf "foo (%s)" v
    ) v) 



let parse_range x =
  let str = Printf.sprintf "\"foo\" : \"%s\"" x in
  let and_sep x = if x = "" then "" else " | " in
  let or_sep x = if x = "" then "" else " & " in
  let const c =
    match c with
    | None -> ""
    | Some (op, v)  -> Printf.sprintf "%s\"%s\"" op v
  in
  let ands xs = List.fold_left (fun acc (_, c) ->
    Printf.sprintf "%s%s%s" acc (and_sep acc) (const c)
  ) "" xs
  in
  let parsed = Npm.Packages.parse_depend ("depends", (Common.Format822.dummy_loc, str)) in
  let str = List.fold_left (fun acc xs ->
    Printf.sprintf "%s%s%s" acc (or_sep acc) (ands xs)
  ) "" parsed in
  str


let get_deps_version deps =
  try
    deps
    |> to_assoc 
    |> List.map (fun (n, r) ->
        let range = r |> member "fixed" |> to_string in
        { package = n; range = parse_range range;}
      )
  with Type_error _ -> []

let rows str =
  let json = from_string str in
  json |> member "rows"

let get_maintainer obj =
  try
    let maintainers = obj |> member "maintainers" |> to_list in
    match maintainers with
    | []   -> {name = "None"; email = "none@none.com";}
    | x::_ -> {name = x |> member "name" |> to_string; email = x |> member "email" |> to_string;}
  with Type_error _ -> {name = "None"; email = "none@none.com";}


let get_repository obj =
  try Some (obj |> member "repository" |> member "url" |> to_string)
  with Type_error _ -> None


let get_data_version obj =
  let license =
    try
      obj |> member "license" |> to_string
    with
      Type_error _ -> "Not defined"
  in
  {
  tarball = obj |> member "dist" |> member "tarball" |> to_string;
  deps = obj |> member "dependencies" |> get_deps_version;
  maintainer = get_maintainer obj;
  license = license;
  dev_repo = get_repository obj;
  description = 
    try Some (obj |> member "description" |> to_string)
    with _ -> None
  }

let get_data id doc =
  (*pretty_to_channel stdout doc;*)
  {
    versions = doc |> member "value" |> to_assoc |> List.map (fun (ver, obj) -> (ver, get_data_version obj));
    id = id;
  }





let get_data_list xs =
  let get_id json = json |> member "id" |> to_string in
  xs |> to_list |> List.map (fun json -> json |> member "doc" |> get_data (get_id json))

let get_data_obj id json =
  let get_result r = 
    try
      List.nth r 0 
    with _ -> 
      Printf.fprintf stderr "Package %s not found in the registry\n" id;
      raise (Invalid_argument "Not found")
  in
  let json =  json |> member "rows" |> to_list |>  get_result in
  let id =  json |> member "id" |> to_string in
  get_data id json


let rec read_all_command channel =
  try
    let str = Pervasives.input_line channel in
    str :: read_all_command channel
  with End_of_file -> []


let remove_prefix =
  List.map (Str.replace_first (Str.regexp "package/") "")

let string_of_files files =
  let sep x = if x = "" then "" else "\n" in
  List.fold_left (fun acc x -> Printf.sprintf "%s%s\"%s\" {\"%s\"}" acc (sep acc) x x) "" files

let string_of_deps deps =
  let dep_str x = Printf.sprintf "\"%s\" {%s}" x.package x.range in
  let sep x = if x = "" then "" else "\n" in
  List.fold_left (fun acc x -> Printf.sprintf "%s%s%s\n" acc (sep acc) (dep_str x)) "" deps


let download tarball =
  let package = Convenience.http_get tarball in
  let (name, output) = Filename.open_temp_file "npm2opam" "" in
  Printf.fprintf output "%s" package;
  close_out output;
  let files = read_all_command (Unix.open_process_in (Printf.sprintf "tar -xvf %s" name)) in
  let md5sum = Digest.to_hex (Digest.string package) in
  ignore (Unix.open_process_in "rm -fr package");
  (md5sum, remove_prefix files)


let generate_opam (doc : doc) =
  let opam_version = "opam-version: \"1.2\"" in
  let name = Printf.sprintf "name: \"%s\"" doc.id in
  let perms = 0o770 in
  Unix.mkdir doc.id perms;
  Unix.chdir doc.id;
  let versions = List.map (fun (v_str, v) ->
    let version = Printf.sprintf "version: \"%s\"" v_str in
    let maintainer = Printf.sprintf "maintainer: \"%s <%s>\"" v.maintainer.name v.maintainer.email in
    let author = Printf.sprintf "author: \"%s <%s>\"" v.maintainer.name v.maintainer.email in
    let license = Printf.sprintf "license: \"%s\"" v.license in
    let dev_repo =
      match v.dev_repo with
      | Some repo -> Printf.sprintf "dev-repo: \"%s\"" repo
      | None -> ""
    in
    let deps = Printf.sprintf "depends: [\n%s\n]" (string_of_deps v.deps) in

    begin
      match v.description with
      | Some descr ->
        let oc = open_out "descr" in
        Printf.fprintf oc "%s\n" descr;
        close_out oc
      | None -> ()
    end;

    (v_str, v.tarball, Printf.sprintf "%s\n%s\n%s\n%s\n%s\n%s\n%s\n%s\n" opam_version name version maintainer author license dev_repo deps)
  ) doc.versions in
  List.iter (fun (v_str, tarball, file_str) ->
    let directory = Printf.sprintf "%s.%s" doc.id v_str in
    Unix.mkdir directory perms;
    Unix.chdir directory;
    let oc = open_out "opam" in
    Printf.fprintf oc "%s\n" file_str;
    close_out oc;
    let (md5sum, files) = download tarball in
    let oc = open_out "url" in
    Printf.fprintf oc "archive: \"%s\"\nchecksum: \"%s\"\n" tarball md5sum;
    close_out oc;

    Unix.mkdir "files" perms;
    Unix.chdir "files";

    let oc = open_out (Printf.sprintf "%s.install" doc.id) in
    Printf.fprintf oc "lib: [\n%s\n]\n" (string_of_files files);
    close_out oc;

    Unix.chdir "..";
    Unix.chdir "..";
  ) versions;
  Unix.chdir ".."


let set_documents = ref StringSet.empty


let rec generate_dependencies documents =
  let deps = List.map (fun x ->
    List.map (fun (_, v) ->
      List.map (fun dep ->
        if StringSet.mem dep.package !set_documents
        then []
        else
          let name = dep.package in
          let url = search_url_doc name in
          try
            if not (StringSet.mem name !set_documents) then
              let doc = (Convenience.http_get url) in
              let documents = [from_string doc |> get_data_obj name] in
              set_documents := StringSet.add name !set_documents;
              x :: generate_dependencies documents
            else
              []
          with _ -> []
      ) v.deps
    ) x.versions
  ) documents in
  List.concat (List.concat (List.concat deps))


let rec generate_all (documents : doc list) =
  let generate x =
    try
      if StringSet.mem x.id !set_documents
      then ()
      else
        set_documents := StringSet.add x.id !set_documents;
        generate_opam x
    with Unix.Unix_error _ -> ()
  in
  List.iter (fun x -> generate x) documents;
  List.iter (fun x ->
    List.iter (fun (_, v) ->
      List.iter (fun dep ->
        if StringSet.mem x.id !set_documents
        then
          try
            let name = dep.package in
            let url = search_url_doc name in
            let doc = (Convenience.http_get url) in
            let documents = [from_string doc |> get_data_obj name] in
            generate_all documents
          with _ -> ()
        else
          ()
      ) v.deps
    ) x.versions
  ) documents



let () =
  let search = Sys.argv.(1) in
  let url = search_url_doc search in
  (*let url = url_doc in*)
  let doc = (Convenience.http_get url) in
  (*let documents = rows doc |> get_data_list in*)
  let documents = [from_string doc |> get_data_obj search] in
  let xs = generate_dependencies documents in
  generate_all xs