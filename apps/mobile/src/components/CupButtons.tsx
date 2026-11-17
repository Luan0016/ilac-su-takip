import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button, Field, Row } from './ui';

export function CupButtons({ sizes, onAdd }: { sizes: number[]; onAdd: (ml: number) => void }) {
  const { t } = useTranslation();
  const [custom, setCustom] = useState<string | null>(null);

  const submitCustom = () => {
    const ml = Number(custom);
    if (!Number.isInteger(ml) || ml <= 0 || ml > 3000) return;
    onAdd(ml);
    setCustom(null);
  };

  return (
    <View style={{ gap: 8 }}>
      <Row>
        {sizes.map((ml) => (
          <Button key={ml} title={`${ml} ml`} variant="secondary" onPress={() => onAdd(ml)} />
        ))}
        <Button title={t('water.custom')} variant="secondary" onPress={() => setCustom(custom === null ? '' : null)} />
      </Row>
      {custom !== null && (
        <Row>
          <View style={{ flex: 1 }}>
            <Field label={t('water.customPrompt')} value={custom} onChangeText={setCustom} keyboardType="number-pad" />
          </View>
          <Button title={t('common.save')} onPress={submitCustom} />
        </Row>
      )}
    </View>
  );
}
