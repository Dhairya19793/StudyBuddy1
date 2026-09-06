import { Tabs } from 'expo-router';
import { StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { BookOpen, Users, ClipboardList, User, Home } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/theme';

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
        tabBarActiveTintColor: Colors.primary[500],
        tabBarInactiveTintColor: Colors.neutral[500],
        tabBarStyle: isDesktop ? styles.sideBar : styles.bottomBar,
        tabBarLabelStyle: isDesktop ? styles.sideBarLabel : styles.bottomBarLabel,
        tabBarItemStyle: isDesktop ? styles.sideBarItem : styles.bottomBarItem,
        tabBarPosition: isDesktop ? 'left' : 'bottom',
        tabBarActiveBackgroundColor: isDesktop ? Colors.sage : undefined,
      }}
    >
      {TAB_ITEMS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color, size }) => (
              <tab.Icon size={isDesktop ? 18 : size} color={color} strokeWidth={2} />
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
    height: Platform.OS === 'web' ? 60 : 84,
    paddingTop: 6,
    paddingBottom: Platform.OS === 'web' ? 6 : 24,
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
    borderRightWidth: StyleSheet.hairlineWidth,
    width: 210,
    paddingTop: 32,
    paddingHorizontal: 12,
  },
  sideBarLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    marginLeft: 2,
  },
  sideBarItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.md,
    marginBottom: 4,
    justifyContent: 'flex-start',
  },
});
