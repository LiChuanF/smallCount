import { DEFAULT_TAGS, PAYMENT_METHODS } from "@/constants/data";
import useDataStore from "@/storage/store/useDataStore";
import { AsyncQueue } from "@/utils/utils";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native"; // 或者使用 expo-router
import { Buffer } from "buffer";
import * as DocumentPicker from "expo-document-picker";
import { EncodingType, readAsStringAsync } from "expo-file-system/legacy";
import { router } from "expo-router";
import iconv from "iconv-lite";
import React, { useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as XLSX from "xlsx";

const ZFB_HEADER_NAME_MAP: any = {
  交易时间: "date",
  商品说明: "goodDesc",
  "收/支": "type",
  金额: "amount",
  备注: "note",
};

const WX_HEADER_NAME_MAP: any = {
  交易时间: "date",
  商品: "goodDesc",
  "收/支": "type",
  "金额(元)": "amount",
  备注: "note",
};

const formatExcelSerialDate = (serial: number) => {
  // Excel 的基准日期是 1899-12-30
  // JS 的基准日期是 1970-01-01
  // 差值是 25569 天
  const utc_days = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400; // 天数转秒
  const date_info = new Date(utc_value * 1000);

  // 处理小数部分（时间）
  const fractional_day = serial - Math.floor(serial) + 0.0000001;
  const total_seconds = Math.floor(86400 * fractional_day);
  const seconds = total_seconds % 60;
  const minutes = Math.floor(total_seconds / 60) % 60;
  const hours = Math.floor(total_seconds / (60 * 60));

  // 构造新的 Date 对象 (使用 UTC 方法避免时区偏移导致的日期变动)
  const date = new Date(
    date_info.getFullYear(),
    date_info.getMonth(),
    date_info.getDate(),
    hours,
    minutes,
    seconds
  );

  // 格式化输出
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const h = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  const s = String(date.getSeconds()).padStart(2, "0");

  return `${y}/${m}/${d} ${h}:${min}:${s}`;
};

// 这是一个辅助组件，用于统一卡片样式
const ActionCard = ({
  iconName,
  iconColor,
  bgIconColor,
  title,
  subtitle,
  badge,
  onPress,
}: any) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.7}
    className="w-full flex-row items-center p-5 rounded-2xl bg-card mb-4 shadow-sm border border-transparent active:border-primary/20"
  >
    {/* Icon Box */}
    <View
      className={`w-12 h-12 rounded-xl items-center justify-center mr-4 ${bgIconColor}`}
    >
      <Ionicons name={iconName} size={24} color={iconColor} />
    </View>

    {/* Text Info */}
    <View className="flex-1">
      <Text className="text-text text-base font-bold">{title}</Text>
      <Text className="text-textSecondary text-xs mt-1">{subtitle}</Text>
    </View>

    {/* Badge or Arrow */}
    {badge ? (
      <View className="bg-primary/20 px-2 py-1 rounded-md">
        <Text className="text-primary text-xs font-medium">{badge}</Text>
      </View>
    ) : (
      <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
    )}
  </TouchableOpacity>
);

export default function ImportScreen() {
  const { addBatchTransactions, tags, paymentMethods, activeAccountId } =
    useDataStore((state) => state);
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);

  const tagIncomeId = tags.find(
    (tag) =>
      tag.name === DEFAULT_TAGS.incomes[DEFAULT_TAGS.incomes.length - 1].name
  )!.id;
  const tagExpensesId = tags.find(
    (tag) =>
      tag.name === DEFAULT_TAGS.expenses[DEFAULT_TAGS.expenses.length - 1].name
  )!.id;
  const paymentZFBMethodId = paymentMethods.find(
    (pm) => pm.name === PAYMENT_METHODS[1].name
  )!.id;
  const paymentWXMethodId = paymentMethods.find(
    (pm) => pm.name === PAYMENT_METHODS[0].name
  )!.id;

  const processImportData = async (jsonData: any[], sourceType: string) => {
    const queue = new AsyncQueue(3);
    // 这里可以根据不同的来源类型进行不同的处理
    console.log(`处理来自${sourceType}的数据，共${jsonData.length}条`);
    console.log(jsonData[0]);

    // 示例：将数据转换为应用需要的格式
    // 实际应用中，这里应该调用数据库服务来保存数据

    if (sourceType === "zfb") {
      // 处理支付宝数据
      console.log(`开始处理支付宝数据，共${jsonData.length}条`);

      // 支付宝数据已经在handlePickDocument中转换好了，直接使用
      const transactionsData = jsonData;

      // 使用队列分批处理数据，每批最多500条
      const batchSize = 500;
      const totalBatches = Math.ceil(transactionsData.length / batchSize);
      let processedBatches = 0;
      let successCount = 0;
      let errorCount = 0;

      // 创建进度提示
      const progressAlert = Alert.alert(
        "导入中",
        `正在导入支付宝账单数据... (0/${totalBatches})`,
        []
      );

      // 分批处理数据
      for (let i = 0; i < transactionsData.length; i += batchSize) {
        const batch = transactionsData.slice(i, i + batchSize);

        // 添加到队列
        queue.add(
          async () => {
            try {
              await addBatchTransactions(batch);
              successCount += batch.length;
              console.log(
                `成功导入批次 ${processedBatches + 1}/${totalBatches}，共 ${batch.length} 条记录`
              );
              return { success: true, count: batch.length };
            } catch (error) {
              errorCount += batch.length;
              console.error(`批次 ${processedBatches + 1} 导入失败:`, error);
              throw error;
            }
          },
          {
            onResolve: () => {
              processedBatches++;
              console.log(`批次 ${processedBatches}/${totalBatches} 处理完成`);
            },
            onReject: (error) => {
              processedBatches++;
              console.error(`批次 ${processedBatches} 处理失败:`, error);
            },
          }
        );
      }

      // 等待所有批次处理完成
      await queue.waitForEmpty();

      // 显示导入结果
      Alert.alert(
        "导入完成",
        `成功导入 ${successCount} 条记录，失败 ${errorCount} 条记录`,
        [{ text: "确定", onPress: () => {} }]
      );
      return;
    } else if (sourceType === "wx") {
      // 处理微信数据
      console.log(`开始处理微信数据，共${jsonData.length}条`);

      // 微信数据已经在handlePickDocument中转换好了，直接使用
      const transactionsData = jsonData;

      // 使用队列分批处理数据，每批最多500条
      const batchSize = 500;
      const totalBatches = Math.ceil(transactionsData.length / batchSize);
      let processedBatches = 0;
      let successCount = 0;
      let errorCount = 0;

      // 创建进度提示
      const progressAlert = Alert.alert(
        "导入中",
        `正在导入微信账单数据... (0/${totalBatches})`,
        []
      );

      // 分批处理数据
      for (let i = 0; i < transactionsData.length; i += batchSize) {
        const batch = transactionsData.slice(i, i + batchSize);

        // 添加到队列
        queue.add(
          async () => {
            try {
              await addBatchTransactions(batch);
              successCount += batch.length;
              console.log(
                `成功导入批次 ${processedBatches + 1}/${totalBatches}，共 ${batch.length} 条记录`
              );
              return { success: true, count: batch.length };
            } catch (error) {
              errorCount += batch.length;
              console.error(`批次 ${processedBatches + 1} 导入失败:`, error);
              throw error;
            }
          },
          {
            onResolve: () => {
              processedBatches++;
              console.log(`批次 ${processedBatches}/${totalBatches} 处理完成`);
            },
            onReject: (error) => {
              processedBatches++;
              console.error(`批次 ${processedBatches} 处理失败:`, error);
            },
          }
        );
      }

      // 等待所有批次处理完成
      await queue.waitForEmpty();

      // 显示导入结果
      Alert.alert(
        "导入完成",
        `成功导入 ${successCount} 条记录，失败 ${errorCount} 条记录`,
        [{ text: "确定", onPress: () => {} }]
      );
      return;
    } else {
      Alert.alert("导入失败", `不支持${sourceType}账单数据导入`, [
        { text: "确定", onPress: () => {} },
      ]);
    }

    Alert.alert(
      "导入成功",
      `已成功导入${jsonData.length}条${sourceType}账单数据`,
      [{ text: "确定", onPress: () => {} }]
    );
  };
  const handlePickDocument = async (sourceType: string) => {
    try {
      setLoading(true);

      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/vnd.ms-excel",
          "text/csv",
          "text/comma-separated-values",
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setLoading(false);
        return;
      }

      const file = result.assets[0];
      const fileUri = file.uri;
      console.log(`读取文件: ${file.name}`);

      // 1. 读取 Base64
      const base64Content = await readAsStringAsync(fileUri, {
        encoding: EncodingType.Base64,
      });

      let workbook;
      const isCSV = file.name.toLowerCase().endsWith(".csv");
      const isXLSX = file.name.toLowerCase().endsWith(".xlsx");
    // TODO: 这里的判断需要优化，zfb账单文件不一定只有csv格式，微信账单也不一定只有xlsx格式
      if (sourceType === "zfb" && !isCSV) {
        Alert.alert(
          "提示",
          "请上传正确的支付宝账单，文件格式为 CSV，且文件内容需包含`支付宝支付科技有限公司  电子客户回单`的字符串",
          [{ text: "确定", onPress: () => {} }]
        );
        return;
      }

      if (sourceType === "wx" && !isXLSX && !isCSV) {
        Alert.alert(
          "提示",
          "请上传正确的微信账单，文件格式为 XLSX 或 CSV，且文件内容需包含`微信支付账单明细列表`的字符串",
          [{ text: "确定", onPress: () => {} }]
        );
        return;
      }
      // 【关键修改 2】zfb csv文件 手动解码逻辑
      if (sourceType === "zfb") {
        try {
          // A. 将 Base64 还原为二进制 Buffer
          const buffer = Buffer.from(base64Content, "base64");

          // B. 使用 iconv-lite 将 gbk 二进制流解码为 UTF-8 字符串
          // 支付宝使用 gbk，微信通常是 utf-8 (但也可能是 gbk，iconv-lite 解码 utf-8 不会报错)
          const decodedString = iconv.decode(buffer, "gbk");

          // C. 将解码后的字符串传给 XLSX
          workbook = XLSX.read(decodedString, {
            type: "string",
          });
        } catch (e) {
          console.error("GBK解码失败，尝试默认读取", e);
          // 如果解码失败，回退到默认读取
          workbook = XLSX.read(base64Content, {
            type: "base64",
          });
        }
      } else {
        // Excel (.xlsx) 本身就是 zip 结构，不需要转码，直接读 Base64
        workbook = XLSX.read(base64Content, {
          type: "base64",
        });
      }

      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      let finalJsonData: any;

      // 【关键修改 3】脏数据清洗逻辑 (定位支付宝/微信真实表头)
      const rawArray = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
      }) as any[][];

      // 定位表头前的第一行 (根据不同的来源类型使用不同的标识)
      let headerRowIndex = 0;

      if (sourceType === "zfb") {
        // 支付宝账单处理
        for (let i = 0; i < rawArray.length; i++) {
          const rowStr = JSON.stringify(rawArray[i]);
          if (
            rowStr &&
            rowStr.indexOf("支付宝支付科技有限公司") > -1 &&
            rowStr.indexOf("电子客户回单") > -1
          ) {
            headerRowIndex = i;
            break;
          }
        }
      } else if (sourceType === "wx") {
        // 微信账单处理
        for (let i = 0; i < rawArray.length; i++) {
          const rowStr = JSON.stringify(rawArray[i]);
          if (rowStr && rowStr.indexOf("微信支付账单明细列表") > -1) {
            headerRowIndex = i;
            break;
          }
        }
      }

      // 使用 header: 1 获取带表头及其后续数据的纯数组模式
      // 这样我们能更方便地通过索引处理，避免 Key 是中文导致操作不便
      // 注意：这里我们改用 header: 1 直接拿数组，方便后续 map 操作
      let dataRows = XLSX.utils.sheet_to_json(worksheet, {
        range: headerRowIndex + 1, // 跳到表头行
        header: 1, // 强制输出为数组格式 [ [时间, 分类, ...], ... ]
        raw: true, // 保持原始格式 (数字就是数字)，不要让xlsx尝试转字符串
      }) as any[][];

      console.log("原始数据:", dataRows[0]);

      const headerRow = dataRows[0];
      const rowIndexMap: any = {};

      // 根据不同的来源类型使用不同的头部映射
      const headerMap =
        sourceType === "wx" ? WX_HEADER_NAME_MAP : ZFB_HEADER_NAME_MAP;

      headerRow.forEach((headerName, index) => {
        if (headerMap[headerName]) {
          rowIndexMap[headerMap[headerName]] = index;
        }
      });

      // 【关键修复】数据清洗与格式转换
      finalJsonData = dataRows
        .filter((row) => row.length > 5) // 过滤掉空行或短行
        .map((row) => {
          let timeVal = row[rowIndexMap.date];
          if (typeof timeVal === "number") {
            timeVal = formatExcelSerialDate(timeVal);
          }

          // 返回处理后的对象 (映射为 App 需要的格式)
          return {
            date: timeVal,
            goodDesc: row[rowIndexMap.goodDesc], // 投资理财
            note: row[rowIndexMap.note], //
            type:
              row[rowIndexMap.type] === "收入"
                ? "income"
                : row[rowIndexMap.type] === "不计收支" || row[rowIndexMap.type] === "/"
                  ? "income"
                  : "expense", // 不计收支 / 支出 / 收入
            amount: sourceType === 'wx' 
              ? (typeof row[rowIndexMap.amount] === 'string' 
                  ? row[rowIndexMap.amount].replace(/[¥￥]/g, '') 
                  : row[rowIndexMap.amount]) 
              : row[rowIndexMap.amount], // 0.08
            raw: row, // 保留原始数据以备查
          };
        })
        .slice(1)
        .map((item) => {
          // 确保日期是有效的Date对象
          let transactionDate;
          try {

            // 尝试直接解析日期
            transactionDate = new Date(item.date);

            // 如果直接解析失败，尝试手动解析 "2025/11/17 15:58:47" 格式
            if (
              isNaN(transactionDate.getTime()) &&
              typeof item.date === "string"
            ) {
              // 使用正则表达式匹配日期时间格式
              const match = item.date.match(
                /(\d{4})\/(\d{1,2})\/(\d{1,2})\s+(\d{1,2}):(\d{1,2}):(\d{1,2})/
              );
              if (match) {
                const year = parseInt(match[1], 10);
                const month = parseInt(match[2], 10) - 1; // 月份从0开始
                const day = parseInt(match[3], 10);
                const hour = parseInt(match[4], 10);
                const minute = parseInt(match[5], 10);
                const second = parseInt(match[6], 10);

                transactionDate = new Date(
                  year,
                  month,
                  day,
                  hour,
                  minute,
                  second
                );
              }
            }

            console.log("转换后的日期:", transactionDate.toLocaleString());

            // 检查日期是否有效
            if (isNaN(transactionDate.getTime())) {
              console.error("无效日期:", item.date);
              // 使用当前日期作为后备
              transactionDate = new Date();
            }
          } catch (error) {
            console.error("日期解析错误:", error);
            transactionDate = new Date();
          }

          return {
            accountId: activeAccountId || "",
            tagId: item.type === "income" ? tagIncomeId : tagExpensesId,
            paymentMethodId:
              sourceType === "wx" ? paymentWXMethodId : paymentZFBMethodId,
            type: item.type,
            amount: Math.abs(parseFloat(item.amount)),
            transactionDate: transactionDate,
            notes: `${item.goodDesc} ${item.note}`,
            description: `${JSON.stringify(item.raw)}`,
            isConfirmed: true,
          };
        });

      setLoading(false);

      if (finalJsonData.length === 0) {
        Alert.alert("提示", "未解析到有效数据");
        return;
      }

      console.log("第一条清洗后的数据:", finalJsonData[0]);

      Alert.alert(
        "解析成功",
        `成功读取 ${finalJsonData.length} 条记录。`,
        [
          {
            text: "确认导入",
            onPress: () => processImportData(finalJsonData, sourceType),
          },
          {
            text: "取消",
            style: "cancel",
          },
        ],
        { cancelable: true }
      );
    } catch (err) {
      setLoading(false);
      console.error("读取失败: ", err);
      Alert.alert("错误", "解析失败: " + (err as Error).message);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center px-4 py-4 border-b border-gray-200 dark:border-gray-800">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="p-2 -ml-2"
        >
          <Ionicons
            name="arrow-back"
            size={24}
            className="text-text"
            style={{ color: "grey" }}
          />
          {/* 注意：NativeWind有时不能直接作用于Icon的color属性，视版本而定，这里为了保险用了style，你也可以用 className="text-text" 配合配置 */}
        </TouchableOpacity>
        <Text className="text-text text-lg font-bold ml-2">数据管理</Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 24 }}>
        {/* Title Section */}
        <View className="mb-8">
          <Text className="text-text text-2xl font-bold mb-2">导入账单</Text>
          <Text className="text-textSecondary text-sm leading-5">
            选择账单来源，系统将自动识别格式并去重。支持 CSV 和 Excel 格式文件。
          </Text>
        </View>

        {/* Import Section */}
        <View>
          {/* Alipay Option */}
          <ActionCard
            iconName="logo-alipay" // 如果 Ionicons 版本旧可能没有 alipay，可以用 "wallet" 代替
            iconColor="#ffffff"
            bgIconColor="bg-blue-500" // 对应 .bg-ali
            title="支付宝账单"
            subtitle="只支持.csv格式的导出（支付宝导出就是为csv）"
            badge="推荐"
            onPress={() => handlePickDocument("zfb")}
          />

          {/* WeChat Option - 使用 generic icon 模拟 */}
          <ActionCard
            iconName="chatbubble-ellipses"
            iconColor="#ffffff"
            bgIconColor="bg-green-500" // 对应 .bg-wx
            title="微信支付账单"
            subtitle="支持 wechat_bill.xlsx"
            onPress={() => handlePickDocument("wx")}
          />

          {/* General CSV Option */}
          <ActionCard
            iconName="document-text"
            iconColor="#ffffff"
            bgIconColor="bg-gray-400 dark:bg-gray-600"
            title="通用 CSV/Excel 文件"
            subtitle="按照标准模板导入"
            onPress={() => handlePickDocument("csv")}
          />
        </View>

        {/* Divider */}
        <View className="h-[1px] bg-gray-200 dark:bg-gray-800 my-6" />

        {/* Export Section */}
        <View>
          <Text className="text-text text-base font-bold mb-4">数据导出</Text>
          <ActionCard
            iconName="cloud-upload"
            iconColor="#3b82f6" // primary color
            bgIconColor="bg-gray-100 dark:bg-gray-800"
            title="导出 Excel / CSV"
            subtitle="备份所有账单数据，支持 Excel 和 CSV 格式"
            onPress={() => router.push("/dataExport")}
          />
        </View>

        {/* Template Download Link */}
        <TouchableOpacity className="mt-8 items-center">
          <Text className="text-primary text-sm underline font-medium">
            下载标准模板示例
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
