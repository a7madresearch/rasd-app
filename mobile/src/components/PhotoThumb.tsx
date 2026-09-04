import React, { useEffect, useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import { ImageIcon } from "lucide-react-native";
import { getSignedPhotoUrl } from "../lib/photoUpload";
import { colors, radius } from "../theme/tokens";

export default function PhotoThumb({ path, size = 52 }: { path: string; size?: number }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    getSignedPhotoUrl(path).then((u) => {
      if (alive) setUrl(u);
    });
    return () => {
      alive = false;
    };
  }, [path]);

  if (!url) {
    return (
      <View style={[styles.placeholder, { width: size, height: size }]}>
        <ImageIcon size={18} color={colors.inkSoft} />
      </View>
    );
  }

  return <Image source={{ uri: url }} style={[styles.image, { width: size, height: size }]} />;
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: colors.paperDeep,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    borderRadius: radius.md,
  },
});
