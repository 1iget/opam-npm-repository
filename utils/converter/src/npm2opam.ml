open Nethttp_client
open Yojson.Basic
open Yojson.Basic.Util
open Unix
open Common

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
}

type doc = { 
  id : string;
  description: string option;
  versions: (string * version) list;
}

let string_of_option opt =
  match opt with
  | Some x -> x
  | None -> "null"


(*URLs to connect to a local CouchDB replica of the NPM registry*)
let url_doc = "http://localhost:5984/registry/_all_docs?include_docs=true&limit=3"
let search_url_doc id =
  Printf.sprintf "http://localhost:5984/registry/%s?include_docs=true" id

let concat_ands v =
  if v = [] then "foo" else
  String.concat " , " (
    List.map (fun v ->
      if v = "" then "foo" 
      else Printf.sprintf "foo (%s)" v
    ) v) 



let parse_range x =
  let out = open_out_gen [Open_wronly; Open_append; Open_creat; Open_text] 0o666 "versions.txt" in
  Printf.fprintf out "%s\n" x;
  let str = Printf.sprintf "\"foo\" : \"%s\"" x in
  let and_sep x = if x = "" then "" else " | " in
  let or_sep x = if x = "" then "" else " & " in
  let const c =
    match c with
    | None -> ""
    | Some (op, v)  -> Printf.sprintf "%s%s" op v
  in
  let ands xs = List.fold_left (fun acc (_, c) ->
    Printf.sprintf "%s%s%s" acc (and_sep acc) (const c)
  ) "" xs
  in
  let parsed = Npm.Packages.parse_depend ("depends", (Format822.dummy_loc, str)) in
  let str = List.fold_left (fun acc xs ->
    Printf.sprintf "%s%s%s" acc (or_sep acc) (ands xs)
  ) "" parsed in
  Printf.fprintf out "%s\n\n" str;
  close_out out;
  str


let get_deps_version deps =
  try
    deps
    |> to_assoc 
    |> List.map (fun (n, r) -> { package = n; range = parse_range (to_string r);})
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
  }

let get_data_versions versions =
  versions |> to_assoc |> List.map (fun (ver, obj) -> (ver, get_data_version obj))

let get_data id doc =
  let get_description =
    try Some (doc |> member "description" |> to_string)
    with Type_error _ -> None
  in
  let versions = doc |> member "versions" in
  {
  description = get_description;
  id = id;
  versions = get_data_versions versions;
  }

let get_data_list xs =
  let get_id json = json |> member "id" |> to_string in
  xs |> to_list |> List.map (fun json -> json |> member "doc" |> get_data (get_id json))

let get_data_obj json =
  let id = json |> member "_id" |> to_string in
  get_data id json

let rec read_all_command channel =
  try
    let str = Pervasives.input_line channel in
    str :: read_all_command channel
  with End_of_file -> []


let remove_prefix = List.map (Str.replace_first (Str.regexp "package/") "")

let string_of_files files =
  let sep x = if x = "" then "" else "\n" in
  List.fold_left (fun acc x -> Printf.sprintf "%s%s\"%s\"" acc (sep acc) x) "" files

let string_of_deps deps =
  let dep_str x = Printf.sprintf "\"%s\" {build & %s}" x.package x.range in
  let sep x = if x = "" then "" else "\n" in
  List.fold_left (fun acc x -> Printf.sprintf "%s%s%s\n" acc (sep acc) (dep_str x)) "" deps


let download tarball =
  let package = Convenience.http_get tarball in
  let (name, output) = Filename.open_temp_file "npm2opam" "" in
  Printf.fprintf output "%s" package;
  close_out output;
  let files = read_all_command (open_process_in (Printf.sprintf "tar -xvf %s" name)) in
  let md5sum = Digest.to_hex (Digest.string package) in
  ignore (open_process_in "rm -fr package");
  (md5sum, remove_prefix files)

let generate_opam doc =
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
    (v_str, v.tarball, Printf.sprintf "%s\n%s\n%s\n%s\n%s\n%s\n%s\n%s\n" opam_version name version maintainer author license dev_repo deps)
  ) doc.versions in
  List.iter (fun (v_str, tarball, file_str) ->
    let directory = Printf.sprintf "%s.%s" doc.id v_str in
    Unix.mkdir directory perms;
    Unix.chdir directory;
    let oc = open_out "opam" in
    Printf.fprintf oc "%s\n" file_str;
    close_out oc;
    begin
      match doc.description with
      | Some descr ->
        let oc = open_out "descr" in
        Printf.fprintf oc "%s\n" descr;
        close_out oc
      | None -> ()
    end;

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

let rec generate_all documents =
  let generate x =
    try
      if StringSet.mem x.id !set_documents
      then ()
      else
        set_documents := StringSet.add x.id !set_documents;
        generate_opam x
    with Unix_error _ -> ()
  in
  List.iter (fun x -> generate x) documents;
  List.iter (fun x ->
    List.iter (fun (_, v) ->
      List.iter (fun dep ->
        let name = dep.package in
        let url = search_url_doc name in
        let doc = (Convenience.http_get url) in
        let documents = [from_string doc |> get_data_obj] in
        generate_all documents
      ) v.deps
    ) x.versions
  ) documents


let () =
  let search = Sys.argv.(1) in
  let url = search_url_doc search in
  (*let url = url_doc in*)
  let doc = (Convenience.http_get url) in
  (*let documents = rows doc |> get_data_list in*)
  let documents = [from_string doc |> get_data_obj] in
  generate_all documents
