{ pkgs }: {
  deps = [
    pkgs.nodejs-22_x
    pkgs.nodePackages.typescript-language-server
    pkgs.yarn
    pkgs.replitPackages.jest
  ];
}

