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
  original_package: string;
  range: string;
}

type version = {
  tarball: string;
  deps: dep list;
  maintainer: maintainer;
  license: string;
  dev_repo: string option;
  description: string option;
  scripts: (string * string) list; (* (step, srcript) *)
  bin: (string * string) list;
}

type doc = { 
  versions: (string * version) list;
  id: string;
  original_id: string option;
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
  if x = "latest"
    then ">= \"0.0.0\""
    else
      begin
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
      end


let default_option def opt =
  match opt with
  | Some x -> x
  | None -> def

let bad_name_re = Re_pcre.regexp "\\."

let fix_bad_name name =
  try
    ignore (Re_pcre.extract bad_name_re name);
    Some (Str.global_replace (Str.regexp "\\.") "_" name)
  with Not_found ->
    None



let get_deps_version deps =
  try
    deps
    |> to_assoc 
    |> List.map (fun (n, r) ->
        let range = r |> member "fixed" |> to_string in
        { package = default_option n (fix_bad_name n); original_package = n; range = parse_range range;}
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


let get_data_version obj id =
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
  let get_bin =
    try
      obj
      |> member "bin"
      |> to_assoc
      |> List.map (fun (x, y) -> (x, to_string y))
    with Type_error _ ->
      try
        obj
        |> member "bin"
        |> (fun x -> [(id, to_string x)])
      with
        Type_error _ -> []
  in
  {
  tarball = obj |> member "dist" |> member "tarball" |> to_string;
  deps = obj |> member "dependencies" |> get_deps_version;
  maintainer = get_maintainer obj;
  license = license;
  dev_repo = get_repository obj;
  scripts = get_script;
  bin = get_bin;
  description = 
    try Some (obj |> member "description" |> to_string)
    with _ -> None
  }



let get_data id doc =
  let fixed = fix_bad_name id in
  let versions = doc |> member "value" |> to_assoc |> List.map (fun (ver, obj) -> (ver, get_data_version obj id)) in
  match fixed with
  | Some fixed -> { versions = versions; id = fixed; original_id = Some id}
  | None -> { versions = versions; id = id; original_id = None}





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
    let process = Unix.open_process_in (Printf.sprintf "tar -xvf %s" name) in
    let files = read_all_command process in
    let md5sum = Digest.to_hex (Digest.string package) in
    ignore (Unix.close_process_in process);
    let process = Unix.open_process_in "rm -fr package" in
    ignore (Unix.close_process_in process);
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
  | Some xs -> Printf.sprintf "install: [\"sh\" \"-c\" \"%s\"]" xs


let get_preinstall xs =
  let pre = get_script "preinstall" xs in
  match pre with
  | None    -> ""
  | Some xs -> Printf.sprintf "build: [\"sh\" \"-c\" \"%s\"]" xs


let get_preuninstall = get_script "preuninstall"
let get_postuninstall = get_script "postuninstall"

let get_uninstalls xs =
  let opts = concat_options [get_preuninstall xs; get_postuninstall xs] in
  match opts with
  | [] -> ""
  | xs ->
      let all = List.fold_left (fun acc x -> Printf.sprintf "%s [ \"sh\" \"-c\" \"%s\" ]" acc x) "" xs in
      Printf.sprintf "remove: [\n %s \n]" all


(* Add scripts for the bin field in npm *)
let add_script_binary (bin : (string * string) list) (xs : (string * string) list) =
  let l = ref xs in
  List.iter (fun (name, file) ->
    let inst_command = Printf.sprintf "ln -s %%{PKG:lib}%%/%s %%{bin}%%/%s" file name in
    let remov_command = Printf.sprintf "rm %%{bin}%%/%s" name in
    l := ("install", inst_command) :: !l;
    l := ("preuninstall", remov_command) :: !l
  ) bin;
  !l

(* If a package name is not a valid, we create a symlink from a invalid name to
 * a one valid in opam *)
let add_script_bad_names fixed (original : string option) (xs : (string * string) list) =
  match original with
  | None -> xs
  | Some original ->
      let install = Printf.sprintf "ln -s %%{lib}%%/%s %%{lib}%%/%s" fixed original in
      let preuninstall = Printf.sprintf "rm %%{lib}%%/%s" original in
      ("install", install) :: ("preuninstall", preuninstall) :: xs




let filter_bin b bin files =
  List.filter (fun file ->
    let file = "./" ^ file in
    try
      ignore (List.find (fun (_, script) ->
        script = file
      ) bin);
      if b then false else true
    with Not_found ->
      if b then true else false
  ) files




let generate_opam (doc : doc) =
  let opam_version = "opam-version: \"1.2\"" in
  let name = Printf.sprintf "name: \"%s\"" doc.id in
  let perms = 0o770 in
  let generate_versions () = 
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
            get_install (add_script_bad_names doc.id doc.original_id (add_script_binary v.bin v.scripts));
            get_preinstall v.scripts;
            get_uninstalls (add_script_bad_names doc.id doc.original_id (add_script_binary v.bin v.scripts));
          ]
      in 
      (v_str, v, v.tarball, all)
    ) doc.versions in
    List.iter (fun (v_str, v, tarball, file_str) ->
      let directory = Printf.sprintf "%s.%s" doc.id v_str in
      Unix.mkdir directory perms;
      Unix.chdir directory;
      let oc = open_out "opam" in
      Printf.fprintf oc "%s\n" file_str;
      close_out oc;
      begin
        match download tarball with
        | Some (md5sum, files) -> 
          let oc = open_out "url" in
          Printf.fprintf oc "archive: \"%s\"\nchecksum: \"%s\"\n" tarball md5sum;
          close_out oc;
          Unix.mkdir "files" perms;
          let oc = open_out (Printf.sprintf "files/%s.install" doc.id) in
          Printf.fprintf oc "lib: [\n%s\n]\n" (string_of_files (filter_bin true v.bin files));
          Printf.fprintf oc "libexec: [\n%s\n]\n" (string_of_files (filter_bin false v.bin files));
          close_out oc
        | None -> ()
      end;
      Unix.chdir ".."
    ) versions;
    Unix.chdir ".."
  in
  try
    Unix.mkdir doc.id perms;
    generate_versions ()
  with Unix.Unix_error _ ->
    if List.length doc.versions = 0
      then ()
      else generate_versions ()


let set_documents = ref StringSet.empty


let rec generate_dependencies documents : doc list =
  let deps = List.map (fun x ->
    List.map (fun (v_str, v) ->
      List.map (fun dep ->
        if StringSet.mem dep.original_package !set_documents
        then []
        else
          try
            let doc = Convenience.http_get (search_url_doc dep.original_package) in
            let document = from_string doc |> get_data_obj dep.original_package in
            set_documents := StringSet.add dep.original_package !set_documents;
            document :: generate_dependencies [document]
          with Invalid_argument _ -> []
      ) v.deps
    ) x.versions
  ) documents in
  List.concat (List.concat (List.concat deps))






let rec generate_all (documents : doc list) =
  ignore (Parmap.parmap ~ncores:8 (fun x -> print_endline x.id; generate_opam x) (Parmap.L documents));
  (*ignore (List.iter (fun x -> print_endline x.id; generate_opam x) documents);*)
  ()


let remove_repeated xs =
  let set_documents = Hashtbl.create (List.length xs) in
  List.iter (fun x -> Hashtbl.add set_documents x.id x) xs;
  Hashtbl.fold (fun key x acc -> x :: acc ) set_documents []


(*Removes the packages that are already in the FS *)
let filter_ready xs =
  print_string "Collection packages from the file system...";
  let table = Update.collect_versions in
  print_endline "ready";
  List.map (fun d ->
    let versions = List.filter (fun (v_str, _) ->
      let key = d.id ^ "." ^ v_str in
      not (Hashtbl.mem table key)
    ) d.versions in
    { d with versions = versions}
  ) xs


let get_latest_version doc =
  let sorted = List.sort (fun (v1, _) (v2, _) -> (Versioning.SemverNode.compare v1 v2) * -1) doc.versions in
  List.nth sorted 0




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
  let xs = document :: xs in
  let xs = filter_ready xs in
  Printf.printf "To create: %d\n" (List.fold_left (fun acc x -> acc + List.length x.versions) 0 xs);
  generate_all xs
