# How to use

```
opam repo add npm https://github.com/fgaray/opam-npm-repository.git
opam update
opam switch install node_modules
```

Now you can use the switch "node_modules" to install opam modules there.
Packages are going to be installed inside $HOME/.opam/node_modules/lib.


# Adding new packages from the npm registry


- Create a mirror of the npm registry mounting a local CouchDB.
- Install the views from https://github.com/fgaray/npm2cudf following the
  instructions there.
- Build npm2opam in this repository in utils/converter/
- Run 'npm2opam PACKAGE_NAME' from the packages/ folder, this will create the
  structure for the packages plus the dependencies.
