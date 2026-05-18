// src/navigation/HomeNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DashboardScreen } from '../screens/main/DashboardScreen';
import { BillDetailScreen } from '../screens/main/BillDetailScreen';
import { BillEditScreen } from '../screens/main/BillEditScreen';
import { SearchScreen } from '../screens/main/SearchScreen';
import { HomeStackParamList } from '../types';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export const HomeNavigator: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Dashboard" component={DashboardScreen} />
    <Stack.Screen name="BillDetail" component={BillDetailScreen} />
    <Stack.Screen name="BillEdit" component={BillEditScreen} />
    <Stack.Screen name="Search" component={SearchScreen} />
  </Stack.Navigator>
);
