import React, { forwardRef, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import GBottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { useColors, ColorPalette, Components } from '@constants/theme';

interface BottomSheetProps {
  snapPoints: (string | number)[];
  children: React.ReactNode;
  index?: number;
}

export const BottomSheet = forwardRef<GBottomSheet, BottomSheetProps>(
  ({ snapPoints, children, index = 0 }, ref) => {
    const C = useColors();
    const styles = useMemo(() => getStyles(C), [C]);
    return (
      <GBottomSheet
        ref={ref}
        index={index}
        snapPoints={snapPoints}
        backgroundStyle={styles.background}
        handleIndicatorStyle={styles.handle}
        topInset={0}
      >
        <BottomSheetView style={styles.content}>
          {children}
        </BottomSheetView>
      </GBottomSheet>
    );
  },
);

BottomSheet.displayName = 'BottomSheet';

function getStyles(C: ColorPalette) {
  return StyleSheet.create({
    background: {
      backgroundColor: C.background.card,
      borderTopLeftRadius: Components.bottomSheetR,
      borderTopRightRadius: Components.bottomSheetR,
    },
    handle: {
      width: Components.handleWidth,
      height: Components.handleHeight,
      backgroundColor: C.background.divider,
      borderRadius: 2,
    },
    content: {
      flex: 1,
    },
  });
}
