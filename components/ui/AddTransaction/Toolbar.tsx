// components/AddTransaction/Toolbar.tsx
import DatePickerModal from '@/components/widgets/DatePickerModal'
import { NewPaymentMethod, PaymentMethod } from '@/db/repositories/PaymentMethodRepository'
import useDataStore from '@/storage/store/useDataStore'
import React, { useEffect, useState } from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import PaymentMethodModal from './PaymentMethodModal'

interface ToolbarProps {
    date: string
    onDateChange?: (date: string) => void
    onPaymentMethodChange?: (method: PaymentMethod) => void
    payMethod?: PaymentMethod
}

export const Toolbar: React.FC<ToolbarProps> = ({
    date,
    onDateChange,
    onPaymentMethodChange,
    payMethod,
}) => {
    const [showDatePicker, setShowDatePicker] = useState(false)
    const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false)
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
        PaymentMethod | NewPaymentMethod | null
    >(null)
    const { paymentMethods } = useDataStore()

    useEffect(() => {
        if (paymentMethods.length > 0) {
            const defaultMethod =
                paymentMethods.find(method => method.isDefault) || paymentMethods[0]
            setSelectedPaymentMethod(defaultMethod)
            if (onPaymentMethodChange) {
                if (payMethod) {
                    setSelectedPaymentMethod(payMethod)
                } else onPaymentMethodChange(defaultMethod as PaymentMethod)
            }
        }
    }, [payMethod])

    // 格式化日期显示为中文格式（如：11月20日）
    const formatDateForDisplay = (dateStr: string) => {
        const date = new Date(dateStr)
        const year = date.getFullYear()
        const month = date.getMonth() + 1 // 月份从0开始，需要+1
        const day = date.getDate()
        return `${year}年${month}月${day}日`
    }

    const handleDatePress = () => {
        setShowDatePicker(true)
    }

    const handleDateConfirm = (date: string) => {
        setShowDatePicker(false)
        // 如果有外部回调函数，调用它
        if (onDateChange) {
            onDateChange(date)
        }
    }

    const handleDateClose = () => {
        setShowDatePicker(false)
    }

    const handlePaymentMethodPress = () => {
        setShowPaymentMethodModal(true)
    }

    const handlePaymentMethodSelect = (method: PaymentMethod) => {
        setSelectedPaymentMethod(method)
        setShowPaymentMethodModal(false)

        // 如果有外部回调函数，调用它
        if (onPaymentMethodChange) {
            onPaymentMethodChange(method)
        }
    }

    const handlePaymentMethodClose = () => {
        setShowPaymentMethodModal(false)
    }

    return (
        <>
            <View className="flex-row gap-3 px-4 py-2 bg-background border-b border-border">
                <TouchableOpacity
                    className="bg-card px-3 py-1.5 rounded-md shadow-sm border border-border"
                    onPress={handleDatePress}
                >
                    <Text className="text-xs text-textSecondary">
                        📅 {formatDateForDisplay(date)}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    className="bg-card px-3 py-1.5 rounded-md shadow-sm border border-border"
                    onPress={handlePaymentMethodPress}
                >
                    <Text className="text-xs text-textSecondary">
                        💰 支付方式：{selectedPaymentMethod ? selectedPaymentMethod.name : ''}
                    </Text>
                </TouchableOpacity>
                {/* TODO: 票据功能 */}
                {/* <TouchableOpacity className="bg-card px-3 py-1.5 rounded-md shadow-sm border border-border">
          <Text className="text-xs text-textSecondary">📷 票据</Text>
        </TouchableOpacity> */}
            </View>

            {/* 日期选择弹窗 */}
            <DatePickerModal
                visible={showDatePicker}
                onClose={handleDateClose}
                onConfirm={handleDateConfirm}
                currentDate={date}
                maxDate={new Date().toISOString().split('T')[0]}
            />

            {/* 支付方式选择弹窗 */}
            <PaymentMethodModal
                visible={showPaymentMethodModal}
                onClose={handlePaymentMethodClose}
                onSelect={handlePaymentMethodSelect}
                selectedId={selectedPaymentMethod?.id}
                data={paymentMethods}
            />
        </>
    )
}
