SRC = update.ml npm2opam.ml
PACKAGES = yojson,netclient,dose3.npm,dose3,re.pcre,parmap


all:
	ocamlfind ocamlopt -g -package $(PACKAGES) -o npm2opam -linkpkg $(SRC)

clean:
	rm -fr 0/ 0.0.1/ 0.workspace/
	rm -rf *.cmi *.cmx

install-dose:
	opam pin add dose https://scm.gforge.inria.fr/anonscm/git/dose/dose.git#node_ranges
