// import DashboardHeader from "@/components/ui/DashboardHeader";
import SwipeableRow from "@/components/widgets/SwipeableRow";
import React, { useState } from "react";
import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function StatsPage() {
  const [showDatePicker, setShowDatePicker] = useState(false);
  // Tab切换状态
  const [activeTab, setActiveTab] = useState<"calendar" | "details">("calendar");
  // 显示日期选择器
  const showDatepicker = () => {
    setShowDatePicker(true);
  };
  // Tab切换处理
  const handleTabChange = (tab: "calendar" | "details") => {
    console.log("切换到 Tab:", tab);
    setActiveTab(tab);
  };
  return (
    <SafeAreaView className="flex-1">
      <Text className="text-2xl font-bold text-blue-900">统计页面</Text>
      <SwipeableRow
        actions={[
          {
            label: "删除",
            onPress: () => console.log("删除"),
            className: "bg-red-500",
            textClassName: "text-white",
          },
          {
            label: "编辑",
            onPress: () => console.log("编辑"),
            className: "bg-yellow-500", 
            textClassName: "text-white",
          },
        ]}
      >
        <Text className="text-2xl font-bold text-blue-900">可滑动行</Text>
      </SwipeableRow>
    </SafeAreaView>
  );
}
