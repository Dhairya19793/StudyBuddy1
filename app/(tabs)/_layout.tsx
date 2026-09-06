import { Tabs } from 'expo-router';
import { StyleSheet, View, Text, Platform, useWindowDimensions, Pressable } from 'react-native';
import { BookOpen, Users, ClipboardList, User, Home } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';

const FOREST = '#2D5F3A';

const TAB_ITEMS = [
  { name: 'index', title: 'Home', Icon: Home },
  { name: 'courses', title: 'Courses', Icon: BookOpen },
  { name: 'pods', title: 'Pods', Icon: Users },
  { name: 'workspace', title: 'Solo', Icon: ClipboardList },
  { name: 'profile', title: 'Profile', Icon: User },
] as const;

export default function TabLayout() {
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 900;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: FOREST,
        tabBarInactiveTintColor: Colors.neutral[400],
        tabBarStyle: isDesktop ? styles.sideBar : styles.bottomBar,
        tabBarLabelStyle: isDesktop ? styles.sideBarLabel : styles.bottomBarLabel,
        tabBarItemStyle: isDesktop ? styles.sideBarItem : styles.bottomBarItem,
        tabBarPosition: isDesktop ? 'left' : 'bottom',
      }}
    >
      {TAB_ITEMS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color, size }) => (
              <tab.Icon size={isDesktop ? 20 : size} color={color} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bottomBar: {
    backgroundColor: Colors.surface,
    borderTopColor: Colors.neutral[200],
    borderTopWidth: 1,
    height: Platform.OS === 'web' ? 64 : 88,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'web' ? 8 : 28,
  },
  bottomBarLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    marginTop: 2,
  },
  bottomBarItem: {
    paddingTop: 4,
  },
  sideBar: {
    backgroundColor: Colors.surface,
    borderRightColor: Colors.neutral[200],
    borderRightWidth: 1,
    width: 220,
    paddingTop: 24,
    paddingHorizontal: 8,
    ...(Shadows.sm as any),
  },
  sideBarLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    marginLeft: 4,
  },
  sideBarItem: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.md,
    marginBottom: 2,
    justifyContent: 'flex-start',
  },
});
