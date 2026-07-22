import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse -> pdfjs-dist conditionally requires "@napi-rs/canvas" at
  // runtime to polyfill DOMMatrix/ImageData/Path2D for text extraction.
  // Next's default serverless bundling/file-tracing doesn't reliably pick
  // up that conditional require, so the native canvas binary silently gets
  // left out of the deployed function and pdfjs-dist blows up with
  // "ReferenceError: DOMMatrix is not defined" the moment a PDF reference
  // is saved. Marking these external tells Next to leave them un-bundled
  // and let Node's normal module resolution (and file tracing) handle them,
  // which correctly includes the native binary in the deployed output.
  serverExternalPackages: ["@napi-rs/canvas", "pdf-parse", "pdfjs-dist"],
};

export default nextConfig;
