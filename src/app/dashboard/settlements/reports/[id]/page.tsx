"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getSettlementReportWithCouriers,
  getCourierReportDetails,
} from "@/lib/settlement-reports";
import {
  SettlementReportWithCouriers,
  CourierReportViewModel,
} from "@/lib/types/settlement-report";
import { format } from "date-fns";

interface SettlementReportPageProps {
  params: {
    id: string;
  };
}

export default function SettlementReportPage({
  params,
}: SettlementReportPageProps) {
  const router = useRouter();
  const [report, setReport] = useState<SettlementReportWithCouriers | null>(
    null
  );
  const [selectedCourierId, setSelectedCourierId] = useState<string | null>(
    null
  );
  const [courierDetails, setCourierDetails] =
    useState<CourierReportViewModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadReport() {
      try {
        setIsLoading(true);
        const data = await getSettlementReportWithCouriers(params.id);
        setReport(data);

        // 첫번째 기사 자동 선택
        if (data.couriers && data.couriers.length > 0) {
          setSelectedCourierId(data.couriers[0].courier_id);
        }
      } catch (err) {
        console.error("Error loading settlement report:", err);
        setError("정산 보고서를 불러오는데 실패했습니다.");
      } finally {
        setIsLoading(false);
      }
    }

    loadReport();
  }, [params.id]);

  // 선택된 기사의 상세 정보 로드
  useEffect(() => {
    if (!selectedCourierId || !report) return;

    async function loadCourierDetails() {
      try {
        setIsLoadingDetails(true);
        const data = await getCourierReportDetails(
          report?.id || "",
          selectedCourierId ?? ""
        );
        setCourierDetails(data);
      } catch (err) {
        console.error("Error loading courier details:", err);
        setError("기사의 정산 내역을 불러오는데 실패했습니다.");
      } finally {
        setIsLoadingDetails(false);
      }
    }

    loadCourierDetails();
  }, [selectedCourierId, report]);

  const handleSelectCourier = (courierId: string) => {
    setSelectedCourierId(courierId);
  };

  const handleBack = () => {
    router.push("/dashboard/settlements/reports");
  };

  const getDateRangeLabel = () => {
    if (!report) return "";
    return `${format(new Date(report.start_date), "yyyy-MM-dd")} ~ ${format(
      new Date(report.end_date),
      "yyyy-MM-dd"
    )}`;
  };

  // 정산 항목 유형별 렌더링 함수
  const renderSettlementDetails = (item: any) => {
    if (!item || !item.details) return null;

    const { details } = item;

    switch (item.settlement_type) {
      case "kurly":
        return (
          <div className="mt-2 bg-gray-50 p-3 rounded-md">
            <h5 className="text-sm font-medium text-gray-900 mb-1">
              컬리 정산 세부 정보
            </h5>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      업체명
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      센터
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      지역
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      금액(만원)
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      정산금액
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {details.details.kurly_settlements.map((detail: any) => (
                    <tr key={detail.id}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                        {detail.company_name}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                        {detail.center || "-"}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                        {detail.region || "-"}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                        {detail.amount?.toLocaleString() || "-"}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                        {detail.settlement_amount?.toLocaleString() || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case "coupang":
        return (
          <div className="mt-2 bg-gray-50 p-3 rounded-md">
            <h5 className="text-sm font-medium text-gray-900 mb-1">
              쿠팡 정산 세부 정보
            </h5>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      이름
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      건수
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      단가
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      공급가
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      부가세
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      합계
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {details.details.coupang_settlements.map((detail: any) => (
                    <tr key={detail.id}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                        {detail.courier_name}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                        {detail.delivery_count?.toLocaleString() || "-"}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                        {detail.unit_price?.toLocaleString() || "-"}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                        {detail.supply_price?.toLocaleString() || "-"}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                        {detail.vat?.toLocaleString() || "-"}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                        {detail.total_amount?.toLocaleString() || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case "general":
        // General settlement has a different structure
        const generalDetails = details.details.general_settlements;

        if (!generalDetails || generalDetails.length === 0) {
          return (
            <div className="mt-2 bg-gray-50 p-3 rounded-md">
              기타 정산 내역이 없습니다.
            </div>
          );
        }

        // Extract columns and rows
        const rowMap = new Map<number, any>();
        const columns = new Set<string>();

        generalDetails.forEach((detail: any) => {
          columns.add(detail.column_name);

          if (!rowMap.has(detail.row_order)) {
            rowMap.set(detail.row_order, {});
          }

          const row = rowMap.get(detail.row_order);
          if (row) {
            row[detail.column_name] = detail.column_value || "";
          }
        });

        const columnArray = Array.from(columns);
        const rows = Array.from(rowMap.values());

        return (
          <div className="mt-2 bg-gray-50 p-3 rounded-md">
            <h5 className="text-sm font-medium text-gray-900 mb-1">
              기타 정산 세부 정보
            </h5>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    {columnArray.map((column, index) => (
                      <th
                        key={index}
                        className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {rows.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {columnArray.map((column, colIndex) => (
                        <td
                          key={colIndex}
                          className="px-4 py-2 whitespace-nowrap text-sm text-gray-500"
                        >
                          {row[column] || "-"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      default:
        return (
          <div className="mt-2 p-3 bg-gray-50 rounded-md">
            상세 정보를 찾을 수 없습니다.
          </div>
        );
    }
  };

  // 정산 보고서 인쇄 준비 페이지로 이동
  const handlePrintReport = () => {
    if (!report) return;
    router.push(`/dashboard/settlements/reports/${report.id}/print`);
  };

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">
            정산 보고서 상세
          </h1>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              목록으로
            </button>
            <button
              type="button"
              onClick={handlePrintReport}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg
                className="-ml-1 mr-2 h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z"
                  clipRule="evenodd"
                />
              </svg>
              인쇄
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="py-4">
          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-10">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
              <p className="mt-2 text-gray-500">정산 보고서를 불러오는 중...</p>
            </div>
          ) : !report ? (
            <div className="text-center py-10">
              <h3 className="mt-2 text-lg font-medium text-gray-900">
                정산 보고서를 찾을 수 없습니다
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                요청하신 보고서가 존재하지 않거나 접근할 수 없습니다.
              </p>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleBack}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  목록으로
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {report.title}
                  </h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    기간: {getDateRangeLabel()}
                  </p>
                </div>
                <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">
                        기사 수
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {report.couriers.length}명
                      </dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">
                        총액
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {report.couriers
                          .reduce(
                            (sum, courier) =>
                              sum + parseFloat(courier.total_amount.toString()),
                            0
                          )
                          .toLocaleString()}
                        원
                      </dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">
                        생성 일시
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {format(
                          new Date(report.created_at),
                          "yyyy-MM-dd HH:mm"
                        )}
                      </dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">
                        생성자
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">관리자</dd>
                    </div>
                  </dl>
                </div>
              </div>

              <div className="bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    기사별 정산 내역
                  </h3>
                </div>

                <div className="border-t border-gray-200">
                  <div className="grid grid-cols-6 gap-4">
                    <div className="col-span-2 border-r border-gray-200">
                      <div className="px-4 py-5">
                        <h4 className="text-sm font-medium text-gray-500 mb-4">
                          기사 목록
                        </h4>
                        <ul className="divide-y divide-gray-200">
                          {report.couriers.map((courier) => (
                            <li key={courier.id}>
                              <a
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleSelectCourier(courier.courier_id);
                                }}
                                className={`block px-4 py-4 hover:bg-gray-50 ${
                                  selectedCourierId === courier.courier_id
                                    ? "bg-blue-50"
                                    : ""
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium text-gray-900">
                                    {courier.courier_name}
                                  </p>
                                  <p className="text-sm font-medium text-blue-600">
                                    {parseFloat(
                                      courier.total_amount.toString()
                                    ).toLocaleString()}
                                    원
                                  </p>
                                </div>
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="col-span-4">
                      <div className="px-4 py-5">
                        {isLoadingDetails ? (
                          <div className="py-10 text-center">
                            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                            <p className="mt-2 text-gray-500">
                              기사의 정산 내역을 불러오는 중...
                            </p>
                          </div>
                        ) : !courierDetails ? (
                          <div className="py-10 text-center">
                            <p className="text-gray-500">
                              기사를 선택하여 상세 내역을 확인하세요.
                            </p>
                          </div>
                        ) : (
                          <div>
                            <div className="flex justify-between items-center mb-4">
                              <h4 className="text-lg font-medium text-gray-900">
                                {courierDetails.courier.courier_name} 정산 내역
                              </h4>
                              <span className="text-lg font-medium text-blue-600">
                                {parseFloat(
                                  courierDetails.courier.total_amount.toString()
                                ).toLocaleString()}
                                원
                              </span>
                            </div>

                            {courierDetails.items.length === 0 ? (
                              <p className="text-gray-500">
                                해당 기간에 정산 내역이 없습니다.
                              </p>
                            ) : (
                              <div className="space-y-4">
                                {courierDetails.items.map((item) => (
                                  <div
                                    key={item.id}
                                    className="border rounded-lg p-4"
                                  >
                                    <div className="flex justify-between items-center">
                                      <div>
                                        <p className="text-sm font-medium text-gray-900">
                                          {format(
                                            new Date(
                                              item.details.settlement.settlement_date
                                            ),
                                            "yyyy-MM-dd"
                                          )}
                                          <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                            {item.settlement_type === "kurly"
                                              ? "컬리"
                                              : item.settlement_type ===
                                                "coupang"
                                              ? "쿠팡"
                                              : "기타"}
                                          </span>
                                        </p>
                                      </div>
                                      <p className="text-sm font-medium text-blue-600">
                                        {parseFloat(
                                          item.amount.toString()
                                        ).toLocaleString()}
                                        원
                                      </p>
                                    </div>

                                    {renderSettlementDetails(item)}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
