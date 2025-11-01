/**
 * @file src/app/api/admin/stats/route.ts
 * @description Admin API endpoint for dashboard statistics.
 * Provides comprehensive statistics for admin dashboard.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handlePrismaError } from "@/lib/errorHandler";

/**
 * GET /api/admin/stats - Fetch dashboard statistics
 * Returns comprehensive statistics for admin dashboard including:
 * - Order counts by status
 * - Revenue calculations
 * - User verification statistics
 * - Recent activity metrics
 */
export async function GET() {
  try {
    // Calculate date ranges
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(today.getFullYear(), now.getMonth() - 1, now.getDate());

    // Fetch all statistics in parallel for better performance
    const [
      totalOrders,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      totalUsers,
      verifiedUsers,
      pendingVerifications,
      totalRevenue,
      pendingRevenue,
      recentOrders,
      ordersLastWeek,
      ordersLastMonth,
      revenueLastWeek,
      revenueLastMonth
    ] = await Promise.all([
      // Order counts
      prisma.order.count(),
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.order.count({ where: { status: 'COMPLETED' } }),
      prisma.order.count({ where: { status: 'CANCELLED' } }),
      
      // User counts
      prisma.user.count(),
      prisma.user.count({ where: { isVerified: true } }),
      prisma.user.count({ where: { isVerified: false } }),
      
      // Revenue calculations
      prisma.order.aggregate({
        where: {
          status: 'COMPLETED',
          paymentStatus: 'VERIFIED'
        },
        _sum: {
          totalAmount: true
        }
      }),
      prisma.order.aggregate({
        where: {
          paymentStatus: 'PAID'
        },
        _sum: {
          totalAmount: true
        }
      }),
      
      // Recent activity
      prisma.order.count({
        where: {
          createdAt: {
            gte: yesterday
          }
        }
      }),
      prisma.order.count({
        where: {
          createdAt: {
            gte: lastWeek
          }
        }
      }),
      prisma.order.count({
        where: {
          createdAt: {
            gte: lastMonth
          }
        }
      }),
      
      // Revenue trends
      prisma.order.aggregate({
        where: {
          status: 'COMPLETED',
          paymentStatus: 'VERIFIED',
          createdAt: {
            gte: lastWeek
          }
        },
        _sum: {
          totalAmount: true
        }
      }),
      prisma.order.aggregate({
        where: {
          status: 'COMPLETED',
          paymentStatus: 'VERIFIED',
          createdAt: {
            gte: lastMonth
          }
        },
        _sum: {
          totalAmount: true
        }
      })
    ]);

    // Calculate completion rate
    const completionRate = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0;
    
    // Calculate verification rate
    const verificationRate = totalUsers > 0 ? Math.round((verifiedUsers / totalUsers) * 100) : 0;
    
    // Calculate average order value
    const averageOrderValue = completedOrders > 0 ? (totalRevenue._sum.totalAmount || 0) / completedOrders : 0;

    // Calculate growth rates
    const orderGrowthWeek = ordersLastWeek > 0 ? Math.round(((recentOrders - (ordersLastWeek - recentOrders)) / (ordersLastWeek - recentOrders)) * 100) : 0;
    const revenueGrowthWeek = revenueLastWeek._sum.totalAmount ? 
      Math.round(((revenueLastWeek._sum.totalAmount - (revenueLastMonth._sum.totalAmount || 0)) / (revenueLastMonth._sum.totalAmount || 1)) * 100) : 0;

    const stats = {
      // Order statistics
      totalOrders,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      completionRate,
      
      // Revenue statistics
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      pendingRevenue: pendingRevenue._sum.totalAmount || 0,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      
      // User statistics
      totalUsers,
      verifiedUsers,
      pendingVerifications,
      verificationRate,
      
      // Activity statistics
      recentOrders,
      ordersLastWeek,
      ordersLastMonth,
      revenueLastWeek: revenueLastWeek._sum.totalAmount || 0,
      revenueLastMonth: revenueLastMonth._sum.totalAmount || 0,
      
      // Growth metrics
      orderGrowthWeek,
      revenueGrowthWeek,
      
      // Status summaries
      orderStatusSummary: {
        pending: pendingOrders,
        completed: completedOrders,
        cancelled: cancelledOrders
      },
      paymentStatusSummary: {
        pending: await prisma.order.count({ where: { paymentStatus: 'PENDING' } }),
        paid: await prisma.order.count({ where: { paymentStatus: 'PAID' } }),
        verified: await prisma.order.count({ where: { paymentStatus: 'VERIFIED' } })
      },
      
      // Recent activity (last 7 days)
      recentActivity: {
        newUsers: await prisma.user.count({
          where: {
            createdAt: {
              gte: lastWeek
            }
          }
        }),
        newOrders: ordersLastWeek,
        newRevenue: revenueLastWeek._sum.totalAmount || 0
      }
    };

    return NextResponse.json({
      success: true,
      data: stats,
      generatedAt: now.toISOString()
    });

  } catch (error) {
    console.error('Admin stats fetch error:', error);
    return handlePrismaError(error);
  }
}
