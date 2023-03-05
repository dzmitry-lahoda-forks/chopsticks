{
  description =
    "Create parallel reality of your Substrate network";
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-parts = {
      url = "github:hercules-ci/flake-parts";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };
  outputs = inputs@{ self, nixpkgs, flake-parts, ... }:
    # we used flake-parts to iterate over system and also to ensure nix dev scales
    (flake-parts.lib.mkFlake { inherit inputs; } {
      imports = [ ./flake-module.nix ];
      systems =
        [ "x86_64-linux" "aarch64-linux" "aarch64-darwin" "x86_64-darwin" ];
    });
}

# {
#   inputs.dream2nix.url = "github:nix-community/dream2nix";
#   outputs = { self, dream2nix }:
#     dream2nix.lib.makeFlakeOutputs {
#       systems = ["x86_64-linux"];
#       config.projectRoot = ./.;
#       source = ./.;
#       projects = ./projects.toml;
#     };
# }
