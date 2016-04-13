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
  scripts: (string * string) list;
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
  let get_script =
    try
      begin
        obj 
        |> member "scripts" 
        |> to_assoc 
        |> List.map (fun (name, script) -> (name, to_string script))
      end
    with Type_error _ -> []
  in
  {
  tarball = obj |> member "dist" |> member "tarball" |> to_string;
  deps = obj |> member "dependencies" |> get_deps_version;
  maintainer = get_maintainer obj;
  license = license;
  dev_repo = get_repository obj;
  scripts = get_script;
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

let get_data_obj id json : doc =
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
  try
    let package = Convenience.http_get tarball in
    let (name, output) = Filename.open_temp_file "npm2opam" "" in
    Printf.fprintf output "%s" package;
    close_out output;
    let files = read_all_command (Unix.open_process_in (Printf.sprintf "tar -xvf %s" name)) in
    let md5sum = Digest.to_hex (Digest.string package) in
    ignore (Unix.open_process_in "rm -fr package");
    Some (md5sum, remove_prefix files)
  with _ -> 
    (*In some cases the tarballs are not avalaible*)
    None


let get_script name (scripts : (string * string) list) : string option =
  try
    let v = List.find (fun (n, _) -> n = name) scripts in
    match v with
    | (_, x) -> Some x
  with Not_found -> None


let rec concat_options (xs : 'a option list) : 'a list =
  match xs with
  | (Some y) :: ys  -> y :: concat_options ys
  | None :: ys      -> concat_options ys
  | []              -> []


let get_install xs =
  let inst = get_script "install" xs in
  match inst with
  | None    -> ""
  | Some xs -> Printf.sprintf "install: [\"sh\" \"-c\" \"'%s'\"]" xs

let get_preinstall xs =
  let pre = get_script "preinstall" xs in
  match pre with
  | None    -> ""
  | Some xs -> Printf.sprintf "build: [\"sh\" \"-c\" \"'%s'\"]" xs


let get_preuninstall = get_script "preuninstall"
let get_postuninstall = get_script "postuninstall"

let get_uninstalls xs =
  let opts = concat_options [get_preuninstall xs; get_postuninstall xs] in
  match opts with
  | [] -> ""
  | xs ->
      let all = List.fold_left (fun acc x -> Printf.sprintf "%s [ \"sh\" \"-c\" \"'%s'\" ]" acc x) "" xs in
      Printf.sprintf "remove: [\n %s \n]" all





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

    let all =
      List.fold_left (fun acc x -> Printf.sprintf "%s%s\n" acc x) ""
        [ opam_version;
          name;
          version;
          maintainer;
          author;
          license;
          dev_repo;
          deps;
          get_install v.scripts;
          get_preinstall v.scripts;
          get_uninstalls v.scripts;
        ]
    in 
    (v_str, v.tarball, all)
  ) doc.versions in
  List.iter (fun (v_str, tarball, file_str) ->
    let directory = Printf.sprintf "%s.%s" doc.id v_str in
    Unix.mkdir directory perms;
    Unix.chdir directory;
    let oc = open_out "opam" in
    Printf.fprintf oc "%s\n" file_str;
    close_out oc;
    match download tarball with
    | Some (md5sum, files) -> 
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
    | None -> ()
  ) versions;
  Unix.chdir ".."


let set_documents = ref StringSet.empty


let rec generate_dependencies documents : doc list =
  let deps = List.map (fun x ->
    List.map (fun (v_str, v) ->
      List.map (fun dep ->
        if StringSet.mem dep.package !set_documents
        then []
        else
          try
            let doc = Convenience.http_get (search_url_doc dep.package) in
            let document = from_string doc |> get_data_obj dep.package in
            set_documents := StringSet.add dep.package !set_documents;
            document :: generate_dependencies [document]
          with Invalid_argument _ -> []
      ) v.deps
    ) x.versions
  ) documents in
  List.concat (List.concat (List.concat deps))


let rec generate_all (documents : doc list) =
  set_documents := StringSet.empty;
  let generate x =
    if StringSet.mem x.id !set_documents
    then ()
    else
      begin
        set_documents := StringSet.add x.id !set_documents;
        try
          generate_opam x
        with Unix.Unix_error _ -> ()
      end
  in
  let size = List.length documents in
  let step d x = Printf.sprintf "%s: %d / %d" d.id x size in
  List.iteri (fun i x -> print_endline (step x i); generate x) documents


let remove_repeated xs =
  let set_documents = Hashtbl.create (List.length xs) in
  List.iter (fun x -> Hashtbl.add set_documents x.id x) xs;
  Hashtbl.fold (fun key x acc -> x :: acc ) set_documents []



let () =
  Printexc.record_backtrace true;
  let search = Sys.argv.(1) in
  let url = search_url_doc search in
  (*let url = url_doc in*)
  let doc = (Convenience.http_get url) in
  (*let documents = rows doc |> get_data_list in*)
  let document = from_string doc |> get_data_obj search in
  let xs = generate_dependencies [document] in
  let xs = remove_repeated xs in
  Printf.printf "Deps: %d\n" (List.length xs);
  generate_all (document :: xs)
  (*Printf.printf "Total dependencies: %d" (List.length xs)*)
