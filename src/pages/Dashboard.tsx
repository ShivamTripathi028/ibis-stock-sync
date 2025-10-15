import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Building2, ShoppingCart, Plus, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalShipments: 0,
    openShipments: 0,
    orderedShipments: 0,
    receivedShipments: 0,
    amazonStock: 0,
    inStock: 0,
    companyOrders: 0,
    pendingOrders: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch shipment counts
      const { count: totalShipments } = await supabase
        .from("shipments")
        .select("*", { count: "exact", head: true });

      const { count: openShipments } = await supabase
        .from("shipments")
        .select("*", { count: "exact", head: true })
        .eq("status", "open");

      const { count: orderedShipments } = await supabase
        .from("shipments")
        .select("*", { count: "exact", head: true })
        .eq("status", "ordered");

      const { count: receivedShipments } = await supabase
        .from("shipments")
        .select("*", { count: "exact", head: true })
        .eq("status", "received");

      // Fetch Amazon stock counts
      const { count: amazonStock } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("destination_type", "amazon");

      const { count: inStock } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("destination_type", "amazon")
        .eq("status", "in-stock");

      // Fetch company order counts
      const { count: companyOrders } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("destination_type", "company");

      const { count: pendingOrders } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("destination_type", "company")
        .eq("status", "pending");

      setStats({
        totalShipments: totalShipments || 0,
        openShipments: openShipments || 0,
        orderedShipments: orderedShipments || 0,
        receivedShipments: receivedShipments || 0,
        amazonStock: amazonStock || 0,
        inStock: inStock || 0,
        companyOrders: companyOrders || 0,
        pendingOrders: pendingOrders || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Overview of your shipments and inventory
            </p>
          </div>
          <Link to="/shipments/create">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Shipment
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Shipments</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalShipments}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.openShipments} open, {stats.orderedShipments} ordered
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Received Shipments</CardTitle>
              <TrendingUp className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.receivedShipments}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Successfully received
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Amazon Stock</CardTitle>
              <ShoppingCart className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.amazonStock}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.inStock} in stock
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Company Orders</CardTitle>
              <Building2 className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.companyOrders}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.pendingOrders} pending
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <Link to="/shipments/create" className="block">
              <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                <Plus className="h-6 w-6" />
                <span className="font-medium">Create New Shipment</span>
              </Button>
            </Link>
            <Link to="/shipments" className="block">
              <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                <Package className="h-6 w-6" />
                <span className="font-medium">View All Shipments</span>
              </Button>
            </Link>
            <Link to="/amazon-inventory" className="block">
              <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                <ShoppingCart className="h-6 w-6" />
                <span className="font-medium">Manage Amazon Stock</span>
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Dashboard;
