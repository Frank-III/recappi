// swift-tools-version:5.9
import PackageDescription

let package = Package(
    name: "FluidAudioBridge",
    platforms: [
        .macOS(.v14)
    ],
    products: [
        .library(
            name: "FluidAudioBridge",
            type: .static,
            targets: ["FluidAudioBridge"]
        ),
    ],
    dependencies: [
        .package(url: "https://github.com/Brendonovich/swift-rs", from: "1.0.7"),
        .package(url: "https://github.com/FluidInference/FluidAudio.git", from: "0.7.7")
    ],
    targets: [
        .target(
            name: "FluidAudioBridge",
            dependencies: [
                .product(name: "SwiftRs", package: "swift-rs"),
                .product(name: "FluidAudio", package: "FluidAudio")
            ],
            path: "Sources"
        ),
    ]
)