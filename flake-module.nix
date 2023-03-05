{ self, ... }: {
  perSystem = { config, self', inputs', pkgs, system, ... }:
    let
      # reuse existing ignores to clone source
      cleaned-src = pkgs.lib.cleanSourceWith {
        src = pkgs.lib.cleanSource ./.;
        filter = pkgs.nix-gitignore.gitignoreFilterPure (name: type:
          # nix files are not used as part of build
          (type == "regular" && pkgs.lib.strings.hasSuffix ".nix" name)
          == false) [ ./.gitignore ] ./.;
      };
    in {
      packages = rec {
        # output is something like what npm 'pkg` does, but more sandboxed
        default = pkgs.buildNpmPackage rec {
          # root hash (hash of hashes of each dependnecies)
          # this should be updated on each dependency change (use `prefetch-npm-deps` to get new hash)

          pname = "chopstics";
          name = pname;
          src = cleaned-src;
        };
      };
    };
}
