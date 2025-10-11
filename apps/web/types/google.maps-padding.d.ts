declare namespace google.maps {
  interface Padding {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  }
  interface MapOptions {
    padding?: Padding;
  }
}
