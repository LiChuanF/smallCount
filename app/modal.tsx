import DashboardHeader from "@/components/ui/DashboardHeader";
import React, { useState } from "react";
import { Text, View } from 'react-native';

export default function ModalScreen() {
  const [showDatePicker, setShowDatePicker] = useState(false);
    // Tab切换状态
    const [activeTab, setActiveTab] = useState<"calendar" | "details">("details");
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
   <View><DashboardHeader
        selectedDate={new Date()}
        onDatePress={showDatepicker}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
      <Text className="text-2xl font-bold text-blue-900">统计页面</Text>
      {activeTab === "calendar" ? <Text>日历视图</Text> : <Text>详情视图</Text>}</View>
  );
}
