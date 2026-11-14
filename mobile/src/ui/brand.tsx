import { Image } from "expo-image";
import { useColorScheme } from "react-native";

/** Official Ninety One Foot Academy crest (public/logo-crest.png on the site). */
export function Crest({ size = 96 }: { size?: number }) {
  return (
    <Image
      source={require("@/assets/images/crest.png")}
      style={{ width: size, height: size }}
      contentFit="contain"
      accessibilityLabel="Blason Ninety One Foot Academy"
    />
  );
}

/** Official N91 | MATCHLAB logo (public/n91-lab-logo.png); white version on dark backgrounds. */
export function Wordmark({ height = 22, light }: { height?: number; light?: boolean }) {
  const dark = useColorScheme() === "dark";
  return (
    <Image
      source={
        light ?? dark
          ? require("@/assets/images/matchlab-wordmark-light.png")
          : require("@/assets/images/matchlab-wordmark.png")
      }
      style={{ height, aspectRatio: 574 / 66 }}
      contentFit="contain"
      accessibilityLabel="N91 MatchLab"
    />
  );
}
