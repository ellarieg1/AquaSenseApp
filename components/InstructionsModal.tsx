
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Props = { visible: boolean; onClose: () => void };

export default function InstructionsModal({ visible, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={S.backdrop}>
        <View style={S.box}>
          <Text style={S.title}>How to Use AquaSense</Text>

          <Text style={S.line}>
            • <Text style={S.bold}>Every time you open the app, press “Sync.”</Text>
          </Text>
          <Text style={S.line}>
            • The bottle sends how much water is <Text style={S.bold}>left</Text>; the app shows how much you <Text style={S.bold}>drank since the last Sync.</Text>
          </Text>
          <Text style={S.line}>
            • <Text style={S.warn}>Do <Text style={S.bold}>NOT</Text> refill before syncing.</Text>{' '}
            If you do, the app can’t calculate what you drank and the extra ounces are lost.
          </Text>
          <Text style={S.line}>
            • Need to dump &amp; refill? Refill first, <Text style={S.bold}>then press Sync once</Text> to set a new starting level.
          </Text>
          <Text style={S.line}>
            • Your daily total resets at midnight. Stay hydrated! 💧
          </Text>

          <TouchableOpacity style={S.button} onPress={onClose}>
            <Text style={S.btnText}>Got it</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const S = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  box: { width: 320, backgroundColor: '#fff', borderRadius: 20, padding: 24 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 14, textAlign: 'center', color: '#1B4965' },
  line: { fontSize: 16, marginBottom: 12, color: '#0c5460' },
  bold: { fontWeight: '700' },
  warn: { color: '#C22525', fontWeight: '700' },
  button: { marginTop: 8, backgroundColor: '#41b8d5', paddingVertical: 12, borderRadius: 14, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
