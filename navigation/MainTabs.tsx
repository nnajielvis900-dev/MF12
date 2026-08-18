import React from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DashboardScreen } from '../screens/DashboardScreen';
import { TransactionsScreen } from '../screens/TransactionsScreen';
import { BudgetScreen } from '../screens/BudgetScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { useFinance } from '../context/FinanceContext';
import { budgetAlerts, budgetStatuses } from '../lib/finance';
import { currentMonthKey } from '../lib/format';
import { colors } from '../lib/theme';

const Tab = createBottomTabNavigator();

function PlaceholderScreen() {
  return <View />;
}

function AddFab() {
  const navigation = useNavigation();
  return (
    <View style={fabStyles.wrap}>
      <Pressable
        onPress={() => navigation.navigate('AddTransaction' as never)}
        style={({ pressed }) => [fabStyles.fab, pressed && { transform: [{ scale: 0.94 }], opacity: 0.9 }]}
        accessibilityLabel="Add transaction"
      >
        <Ionicons name="add" size={28} color={colors.accentDark} />
      </Pressable>
    </View>
  );
}

const fabStyles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -22,
    shadowColor: '#059669',
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
    borderWidth: 4,
    borderColor: colors.bg,
  },
});

export function MainTabs() {
  const { budgets, transactions } = useFinance();
  const insets = useSafeAreaInsets();

  const alertCount = budgetAlerts(budgetStatuses(budgets, transactions, currentMonthKey())).length;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: 64 + (Platform.OS === 'ios' ? insets.bottom : Math.min(insets.bottom, 12)),
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10.5,
          fontWeight: '700',
        },
        tabBarBadgeStyle: {
          backgroundColor: colors.rose,
          color: '#fff',
          fontSize: 10,
          fontWeight: '800',
          minWidth: 18,
          height: 18,
          borderRadius: 9,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Activity"
        component={TransactionsScreen}
        options={{
          tabBarLabel: 'Activity',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'stats-chart' : 'stats-chart-outline'} size={21} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="AddEntry"
        component={PlaceholderScreen}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('AddTransaction');
          },
        })}
        options={{
          tabBarLabel: '',
          tabBarButton: () => <AddFab />,
        }}
      />
      <Tab.Screen
        name="Budgets"
        component={BudgetScreen}
        options={{
          tabBarLabel: 'Budgets',
          tabBarBadge: alertCount > 0 ? alertCount : undefined,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'speedometer' : 'speedometer-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={22} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
