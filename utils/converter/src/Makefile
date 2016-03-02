SRC = npm2opam.ml
PACKAGES = yojson,netclient,dose3.npm,dose3


all:
	ocamlfind ocamlopt -p -package $(PACKAGES) -o npm2opam -linkpkg $(SRC)

clean:
	rm -fr 0/ 0.0.1/ 0.workspace/

install-dose:
	opam pin add dose https://scm.gforge.inria.fr/anonscm/git/dose/dose.git#node_ranges
