


let rec read_all_command channel =
  try
    let str = Pervasives.input_line channel in
    str :: read_all_command channel
  with End_of_file -> []


let split_line (t : string) (str : string) : string list = Str.split (Str.regexp t) str

let name_re = Re_pcre.regexp "[\\D|\\.]*"




let collect_versions =
  let p = Unix.open_process_in "find . -iname opam" in
  let contents = read_all_command p in
  let table = Hashtbl.create (List.length contents) in
  List.iter (fun x ->
    let result = split_line "/" x in
    match result with
    | _::_::name_version::_::[] ->
       begin
         Hashtbl.add table name_version ()
       end
    | _ -> print_endline x; assert false
  ) contents;
  table
