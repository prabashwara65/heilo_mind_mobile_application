import { StyleSheet,TouchableOpacity} from 'react-native'
import React from 'react'
import { BackButtonProps } from '@/types'
import { useRouter } from 'expo-router';
import { CaretLeftIcon } from 'phosphor-react-native';
import { verticalScale } from '@/utils/styling';
import { colors, radius } from '@/constants/theme';

const BackButton = ({
    style,
    iconSize = 24,
    fallbackRoute,
}: BackButtonProps) => {
    const router = useRouter();

    const handlePress = () => {
      if (router.canGoBack()) {
        router.back();
        return;
      }

      if (fallbackRoute) {
        router.replace(fallbackRoute);
      }
    };

  return (
    <TouchableOpacity onPress={handlePress} style={[styles.button, style]}>
      <CaretLeftIcon
        size={verticalScale(iconSize)} 
        color={colors.surface}
        weight='bold'/>

    </TouchableOpacity>
  )
}

export default BackButton

const styles = StyleSheet.create({
    button: {
        backgroundColor: `${colors.textSecondary}40`,
        alignSelf: 'flex-start',
        borderRadius: radius._30,
        borderCurve: 'continuous',
        padding: 5
    }
})
