import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

// Register fonts
Font.register({
  family: "Roboto",
  src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf",
});

Font.register({
  family: "Roboto-Bold",
  src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf",
});

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#FFFFFF",
    padding: 30,
    fontFamily: "Roboto",
  },
  header: {
    marginBottom: 20,
    textAlign: "center",
  },
  title: {
    fontSize: 24,
    fontFamily: "Roboto-Bold",
    marginBottom: 10,
    color: "#0F172A",
  },
  subtitle: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 5,
  },
  section: {
    margin: 10,
    padding: 10,
    flexGrow: 1,
  },
  summaryGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingBottom: 20,
  },
  summaryItem: {
    width: "30%",
  },
  summaryLabel: {
    fontSize: 10,
    color: "#64748B",
    marginBottom: 5,
  },
  summaryValue: {
    fontSize: 16,
    fontFamily: "Roboto-Bold",
    color: "#0F172A",
  },
  table: {
    display: "table",
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  tableRow: {
    margin: "auto",
    flexDirection: "row",
  },
  tableColHeader: {
    width: "33.33%",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderLeftWidth: 0,
    borderTopWidth: 0,
    backgroundColor: "#F8FAFC",
    padding: 8,
  },
  tableCol: {
    width: "33.33%",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 8,
  },
  tableCellHeader: {
    margin: "auto",
    fontSize: 10,
    fontFamily: "Roboto-Bold",
    color: "#475569",
  },
  tableCell: {
    margin: "auto",
    fontSize: 10,
    color: "#334155",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: "center",
    fontSize: 10,
    color: "#94A3B8",
  },
});

const formatCurrency = (value) => {
  const num = Number(value) || 0;
  return num.toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};

const InstructorReportPDF = ({ data, range }) => {
  const summary = data?.summary || {};
  const chartData = data?.chart || [];

  const rangeText =
    range === "alltime"
      ? "Mọi thời điểm"
      : range === "6months"
        ? "6 tháng qua"
        : "12 tháng qua";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Báo cáo hiệu suất</Text>
          <Text style={styles.subtitle}>
            Ngày xuất: {new Date().toLocaleDateString("vi-VN")}
          </Text>
          <Text style={styles.subtitle}>Phạm vi: {rangeText}</Text>
        </View>

        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Tổng doanh thu</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(summary.totalRevenue || 0)}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Tổng lượt đăng ký</Text>
            <Text style={styles.summaryValue}>
              {summary.totalEnrollments || 0}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Đánh giá giảng viên</Text>
            <Text style={styles.summaryValue}>
              {summary.instructorRating?.toFixed(2) || 0} / 5
            </Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableRow}>
            <View style={styles.tableColHeader}>
              <Text style={styles.tableCellHeader}>Thời gian</Text>
            </View>
            <View style={styles.tableColHeader}>
              <Text style={styles.tableCellHeader}>Doanh thu</Text>
            </View>
            <View style={styles.tableColHeader}>
              <Text style={styles.tableCellHeader}>Lượt đăng ký</Text>
            </View>
          </View>

          {chartData.map((item, index) => (
            <View style={styles.tableRow} key={index}>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{item.month}</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>
                  {formatCurrency(item.revenue)}
                </Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{item.enrollments}</Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.footer}>
          Báo cáo được xuất từ hệ thống NewZLearn
        </Text>
      </Page>
    </Document>
  );
};

export default InstructorReportPDF;
