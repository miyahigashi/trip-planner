// apps/web/src/components/SignedImage.tsx
import Image from "next/image";

type Props = { objectKey: string; alt: string; width: number; height: number; className?: string };

export default function SignedImage({ objectKey, alt, width, height, className }: Props) {
  const src =
    objectKey.startsWith("http://") || objectKey.startsWith("https://")
      ? objectKey
      : `https://storage.googleapis.com/${process.env.NEXT_PUBLIC_GCS_BUCKET}/${objectKey}`;

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      // まずは確実に表示確認したい時は true に（エラー回避）
      unoptimized
    />
  );
}
