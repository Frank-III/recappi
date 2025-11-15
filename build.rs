fn main() {
  napi_build::setup();

  #[cfg(target_os = "macos")]
  {
    use swift_rs::SwiftLinker;

    // Link Swift runtime and our FluidAudioBridge package
    SwiftLinker::new("14.0")
      .with_package("FluidAudioBridge", "src/macos/FluidAudioBridge")
      .link();

    // Add rpath for Swift runtime libraries
    println!("cargo:rustc-link-arg=-Wl,-rpath,/usr/lib/swift");
    println!("cargo:rustc-link-arg=-Wl,-rpath,/Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/lib/swift/macosx");
  }
}
