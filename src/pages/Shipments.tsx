import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Package, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { formatDistanceToNow } from "date-fns";

interface Shipment {
  id: string;
  shipment_number: string;
  status: "open" | "ordered" | "received";
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const Shipments = () => {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    try {
      const { data, error } = await supabase
        .from("shipments")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setShipments(data || []);
    } catch (error) {
      console.error("Error fetching shipments:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "ordered":
        return "bg-warning/10 text-warning border-warning/20";
      case "received":
        return "bg-success/10 text-success border-success/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Shipments</h1>
            <p className="text-muted-foreground mt-1">
              Manage your shipments and track their status
            </p>
          </div>
          <Link to="/shipments/create">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Shipment
            </Button>
          </Link>
        </div>

        {/* Shipments List */}
        {loading ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
            <p className="text-muted-foreground">Loading shipments...</p>
          </div>
        ) : shipments.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No shipments yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first shipment to get started
              </p>
              <Link to="/shipments/create">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Shipment
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {shipments.map((shipment) => (
              <Card key={shipment.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{shipment.shipment_number}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Created {formatDistanceToNow(new Date(shipment.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <Badge className={getStatusColor(shipment.status)} variant="outline">
                      {shipment.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {shipment.notes && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {shipment.notes}
                    </p>
                  )}
                  <Link to={`/shipments/${shipment.id}`}>
                    <Button variant="outline" className="w-full gap-2">
                      <Eye className="h-4 w-4" />
                      View Details
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Shipments;
