import { Tabs } from 'expo-router';
import { StyleSheet, Platform, useWindowDimensions, View, Text } from 'react-native';
import { BookOpen, Users, ClipboardList, User, Home, MessageCircle } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useConversations } from '@/hooks/useStudyData';

const TAB_ITEMS = [
  { name: 'index', title: 'Home', Icon: Home },
  { name: 'courses', title: 'Courses', Icon: BookOpen },
  { name: 'messages', title: 'Messages', Icon: MessageCircle },
  { name: 'pods', title: 'Pods', Icon: Users },
  { name: 'workspace', title: 'Solo', Icon: ClipboardList },
  { name: 'profile', title: 'Profile', Icon: User },
] as const;

function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <View style={styles.unreadBadge}>
      <Text style={styles.unreadBadgeText}>
        {count > 99 ? '99+' : count}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 900;
  const { totalUnread } = useConversations();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary[500],
        tabBarInactiveTintColor: Colors.neutral[500],
        tabBarStyle: isDesktop ? styles.topBar : styles.bottomBar,
        tabBarLabelStyle: isDesktop ? styles.topBarLabel : styles.bottomBarLabel,
        tabBarItemStyle: isDesktop ? styles.topBarItem : styles.bottomBarItem,
        tabBarPosition: isDesktop ? 'top' : 'bottom',
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
              <View>
                <tab.Icon size={isDesktop ? 17 : size} color={color} strokeWidth={2} />
                {tab.name === 'messages' && <UnreadBadge count={totalUnread} />}
              </View>
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
    height: Platform.OS === 'web' ? 56 : 84,
    paddingTop: 4,
    paddingBottom: Platform.OS === 'web' ? 4 : 24,
  },
  bottomBarLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    marginTop: 2,
  },
  bottomBarItem: {
    paddingTop: 4,
  },
  topBar: {
    backgroundColor: Colors.surface,
    borderBottomColor: Colors.neutral[200],
    borderBottomWidth: StyleSheet.hairlineWidth,
    height: 52,
    paddingHorizontal: 24,
  },
  topBarLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    marginLeft: 4,
  },
  topBarItem: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
  },
  unreadBadge: {
    position: 'absolute',
    top: -6,
    right: -10,
    backgroundColor: '#E53E3E',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  unreadBadgeText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
    color: '#FFFFFF',
  },
});
