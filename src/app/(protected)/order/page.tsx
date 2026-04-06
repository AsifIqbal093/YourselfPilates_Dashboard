/* eslint-disable no-console */
"use client";

import React, { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getOrders } from "@/lib/apiActions";
import { Order } from "@/types/api";

/** DRF often omits `?page=1` on the first page — treat missing `page` as page 1. */
function getPageFromUrl(url: string | null): number | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const p = u.searchParams.get("page");
    if (!p) return 1;
    const n = Number(p);
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}

const OrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [effectivePageSize, setEffectivePageSize] = useState<number>(5);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [prevUrl, setPrevUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const data = await getOrders({ page: currentPage });
        setOrders(data.results || []);
        setTotalCount(data.count ?? 0);
        setNextUrl(data.next ?? null);
        setPrevUrl(data.previous ?? null);

        // If backend ignores page_size, compute total pages from real page size.
        const resultsLen = (data.results || []).length;
        if (resultsLen > 0) {
          // Prefer using a stable page size from the API whenever possible.
          if (data.next) {
            setEffectivePageSize(resultsLen);
          } else if (currentPage === 1) {
            setEffectivePageSize(resultsLen);
          }
        }

        // Keep UI page number aligned with backend pagination URLs
        const prevPage = getPageFromUrl(data.previous ?? null);
        const nextPage = getPageFromUrl(data.next ?? null);
        const derivedCurrent =
          prevPage !== null
            ? prevPage + 1
            : nextPage !== null
              ? nextPage - 1
              : 1;
        if (derivedCurrent !== currentPage) setCurrentPage(derivedCurrent);
      } catch (error) {
        console.error("Failed to fetch orders:", error);
        setOrders([]);
        setTotalCount(0);
        setNextUrl(null);
        setPrevUrl(null);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [currentPage]);

  // Pagination calculations (server-side)
  const totalPages = Math.max(1, Math.ceil(totalCount / effectivePageSize));

  const handlePrevPage = () => {
    if (!prevUrl) return;
    const target = getPageFromUrl(prevUrl);
    if (!target) return;
    setCurrentPage(target);
  };

  const handleNextPage = () => {
    if (!nextUrl) return;
    const target = getPageFromUrl(nextUrl);
    if (!target) return;
    setCurrentPage(target);
  };

  if (loading) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold">Orders</h1>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="px-2">
      <h1 className="text-2xl font-bold px-2">Orders</h1>

      {orders.length === 0 ? (
        <p>No orders found.</p>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Package Title</TableHead>
                <TableHead>Total Hours</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Payment Status</TableHead>
                <TableHead>Created_at</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{order.user_name}</TableCell>
                  <TableCell>{order.user_email}</TableCell>
                  <TableCell>{order.pack_details.title}</TableCell>
                  <TableCell>{order.pack_details.total_hours}</TableCell>
                  <TableCell>Є{parseFloat(order.amount).toFixed(2)}</TableCell>
                  <TableCell className="capitalize">
                    {order.payment_method}
                  </TableCell>
                  <TableCell>{order.payment_status}</TableCell>
                  <TableCell>
                    {new Date(order.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center mt-6 space-x-2">
              <Button
                onClick={handlePrevPage}
                disabled={loading || !prevUrl}
                variant="outline"
              >
                Previous
              </Button>
              <span className="text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                onClick={handleNextPage}
                disabled={loading || !nextUrl}
                variant="outline"
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default OrdersPage;
