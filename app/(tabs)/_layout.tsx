import BottomNav from "@/components/ui/BottomNav";
import { Tabs } from "expo-router";

/**
 * Tabs 布局 - 包含底部导航的 Tab 页面容器
 */
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          display: 'none',
        },
      }}
      tabBar={(props) => <BottomNav />}
    >
      <Tabs.Screen name="index" options={{ title: "明细" }} />
      <Tabs.Screen name="stats" options={{ title: "统计分析" }} />
      <Tabs.Screen name="ledgers" options={{ title: "账本管理" }} />
      <Tabs.Screen name="profile" options={{ title: "个人中心" }} />
    </Tabs>
  );
}