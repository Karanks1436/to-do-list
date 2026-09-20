import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Btn, Card, Header } from '../components/UI';
import { s } from '../styles';

const DEFAULT_MATERIALS = [
  { id: 'plastic_pet', name: 'PET Plastic', rate: 12 },
  { id: 'plastic_hdpe', name: 'HDPE Plastic', rate: 10 },
  { id: 'plastic_other', name: 'Other Plastic', rate: 8 },
  { id: 'paper', name: 'Paper', rate: 8 },
  { id: 'cardboard', name: 'Cardboard', rate: 7 },
  { id: 'newspaper', name: 'Newspaper', rate: 9 },
  { id: 'glass', name: 'Glass', rate: 6 },
  { id: 'iron', name: 'Iron', rate: 30 },
  { id: 'steel', name: 'Steel', rate: 28 },
  { id: 'aluminium', name: 'Aluminium', rate: 120 },
  { id: 'copper', name: 'Copper', rate: 600 },
  { id: 'electronics', name: 'E-Waste', rate: 80 },
];

export default function AdminScreen({
  pending = [],
  approve,
  setRate,
  logout,
}) {
  const [month, setMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );

  const [materials, setMaterials] = useState(DEFAULT_MATERIALS);
  const [savingId, setSavingId] = useState(null);

  const updatePrice = (id, value) => {
    setMaterials((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              rate: value,
            }
          : item
      )
    );
  };

  const publishRate = async (material) => {
    const numericRate = Number(material.rate);

    if (!material.rate || isNaN(numericRate) || numericRate < 0) {
      Alert.alert(
        'Invalid Price',
        `Please enter a valid price for ${material.name}.`
      );
      return;
    }

    try {
      setSavingId(material.id);

      await setRate({
        materialId: material.id,
        materialName: material.name,
        month,
        ratePerKg: numericRate,
      });

      Alert.alert(
        'Price Updated',
        `${material.name} price updated to ₹${numericRate}/kg`
      );
    } catch (error) {
      console.log('Rate update error:', error);

      Alert.alert(
        'Error',
        'Could not update the price. Please try again.'
      );
    } finally {
      setSavingId(null);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={s.page}
      keyboardShouldPersistTaps="handled"
    >
      <Header title="Admin Console" />

      {/* Pending Collectors */}
      <Text style={s.section}>Pending Collectors</Text>

      {pending.length === 0 ? (
        <Card>
          <Text style={s.small}>
            No pending collectors.
          </Text>
        </Card>
      ) : (
        pending.map((collector) => (
          <Card key={collector.id}>
            <Text style={s.whiteTitle}>
              {collector.name || 'Unknown User'}
            </Text>

            <Text style={s.small}>
              {collector.email || 'No email'}
            </Text>

            <Btn
              title="Approve Collector"
              onPress={() => approve(collector.id)}
            />
          </Card>
        ))
      )}

      {/* Monthly Rates */}
      <Text style={s.section}>
        Material Prices
      </Text>

      <Card>
        <Text style={s.small}>
          Select the month for which these prices will be published.
        </Text>

        <TextInput
          style={[
            s.input,
            {
              color: '#173a31',
              marginTop: 10,
            },
          ]}
          value={month}
          onChangeText={setMonth}
          placeholder="YYYY-MM"
          placeholderTextColor="#777"
        />
      </Card>

      {/* All Materials */}
      {materials.map((material) => (
        <Card key={material.id}>
          <Text style={s.whiteTitle}>
            {material.name}
          </Text>

          <Text style={s.small}>
            Material ID: {material.id}
          </Text>

          <View
            style={{
              marginTop: 10,
              marginBottom: 5,
            }}
          >
            <Text
              style={{
                color: '#173a31',
                fontSize: 14,
                fontWeight: '600',
                marginBottom: 6,
              }}
            >
              Price per KG
            </Text>

            <TextInput
              style={[
                s.input,
                {
                  color: '#173a31',
                  marginBottom: 10,
                },
              ]}
              value={String(material.rate)}
              onChangeText={(value) =>
                updatePrice(material.id, value)
              }
              keyboardType="decimal-pad"
              placeholder="₹ per kg"
              placeholderTextColor="#777"
            />
          </View>

          <Text
            style={{
              color: '#173a31',
              fontSize: 18,
              fontWeight: 'bold',
              marginBottom: 10,
            }}
          >
            Current: ₹{material.rate}/kg
          </Text>

          <Btn
            title={
              savingId === material.id
                ? 'Updating...'
                : 'Update Price'
            }
            onPress={() => publishRate(material)}
          />
        </Card>
      ))}

      {/* Logout */}
      <Btn
        outline
        title="Logout"
        onPress={logout}
      />
    </ScrollView>
  );
}