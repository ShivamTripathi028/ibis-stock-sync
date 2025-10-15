import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Plus, Truck, CheckCircle } from "lucide-react";
import Layout from "@/components/Layout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Shipment {
  id: string;
  shipment_number: string;
  status: "open" | "ordered" | "received";
  notes: string | null;
  created_at: string;
}

interface Order {
  id: string;
  sku: string;
  model_number: string | null;
  product_name: string;
  quantity: number;
  destination_type: "company" | "amazon";
  status: string;
  notes: string | null;
  company_id: string | null;
  companies: { name: string } | null;
}

interface Company {
  id: string;
  name: string;
}

const ShipmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOrderOpen, setAddOrderOpen] = useState(false);
  
  // Form state
  const [sku, setSku] = useState("");
  const [modelNumber, setModelNumber] = useState("");
  const [productName, setProductName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [destinationType, setDestinationType] = useState<"company" | "amazon">("company");
  const [companyId, setCompanyId] = useState("");
  const [orderNotes, setOrderNotes] = useState("");

  useEffect(() => {
    if (id) {
      fetchShipmentDetails();
      fetchCompanies();
    }
  }, [id]);

  const fetchShipmentDetails = async () => {
    try {
      const { data: shipmentData, error: shipmentError } = await supabase
        .from("shipments")
        .select("*")
        .eq("id", id)
        .single();

      if (shipmentError) throw shipmentError;
      setShipment(shipmentData);

      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select(`
          *,
          companies (
            name
          )
        `)
        .eq("shipment_id", id);

      if (ordersError) throw ordersError;
      setOrders(ordersData || []);
    } catch (error) {
      console.error("Error fetching shipment details:", error);
      toast.error("Failed to load shipment details");
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .order("name");

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error("Error fetching companies:", error);
    }
  };

  const handleAddOrder = async () => {
    try {
      const { error } = await supabase.from("orders").insert([
        {
          shipment_id: id,
          sku,
          model_number: modelNumber || null,
          product_name: productName,
          quantity: parseInt(quantity),
          destination_type: destinationType,
          company_id: destinationType === "company" ? companyId : null,
          notes: orderNotes || null,
          status: "pending",
        },
      ]);

      if (error) throw error;

      toast.success("Order added successfully!");
      setAddOrderOpen(false);
      resetForm();
      fetchShipmentDetails();
    } catch (error: any) {
      toast.error(error.message || "Failed to add order");
    }
  };

  const resetForm = () => {
    setSku("");
    setModelNumber("");
    setProductName("");
    setQuantity("");
    setDestinationType("company");
    setCompanyId("");
    setOrderNotes("");
  };

  const handleUpdateStatus = async (newStatus: "open" | "ordered" | "received") => {
    try {
      const { error } = await supabase
        .from("shipments")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;

      // If marking as received, update Amazon orders to in-stock
      if (newStatus === "received") {
        const { error: ordersError } = await supabase
          .from("orders")
          .update({ status: "in-stock" })
          .eq("shipment_id", id)
          .eq("destination_type", "amazon");

        if (ordersError) throw ordersError;
      }

      toast.success(`Shipment marked as ${newStatus}!`);
      fetchShipmentDetails();
    } catch (error: any) {
      toast.error(error.message || "Failed to update status");
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

  if (loading || !shipment) {
    return (
      <Layout>
        <div className="p-6">Loading...</div>
      </Layout>
    );
  }

  const companyOrders = orders.filter((o) => o.destination_type === "company");
  const amazonOrders = orders.filter((o) => o.destination_type === "amazon");

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/shipments">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{shipment.shipment_number}</h1>
            <p className="text-muted-foreground mt-1">Shipment details and orders</p>
          </div>
          <Badge className={getStatusColor(shipment.status)} variant="outline">
            {shipment.status}
          </Badge>
        </div>

        {/* Status Actions */}
        {shipment.status !== "received" && (
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
              <CardDescription>Update shipment status</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-3">
              {shipment.status === "open" && (
                <Button onClick={() => handleUpdateStatus("ordered")} className="gap-2">
                  <Truck className="h-4 w-4" />
                  Mark as Ordered
                </Button>
              )}
              {shipment.status === "ordered" && (
                <Button onClick={() => handleUpdateStatus("received")} className="gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Mark as Received
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Add Order Dialog */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Orders</CardTitle>
                <CardDescription>Products in this shipment</CardDescription>
              </div>
              <Dialog open={addOrderOpen} onOpenChange={setAddOrderOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Product
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add Product to Shipment</DialogTitle>
                    <DialogDescription>
                      Enter product details and select destination
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="sku">SKU *</Label>
                        <Input
                          id="sku"
                          value={sku}
                          onChange={(e) => setSku(e.target.value)}
                          placeholder="e.g., RAK-123"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="modelNumber">Model Number</Label>
                        <Input
                          id="modelNumber"
                          value={modelNumber}
                          onChange={(e) => setModelNumber(e.target.value)}
                          placeholder="Optional"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="productName">Product Name *</Label>
                      <Input
                        id="productName"
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                        placeholder="e.g., WisGate Edge Gateway"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantity *</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        placeholder="1"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="destinationType">Requested By *</Label>
                      <Select
                        value={destinationType}
                        onValueChange={(value: "company" | "amazon") =>
                          setDestinationType(value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="company">Company</SelectItem>
                          <SelectItem value="amazon">Amazon Stock</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {destinationType === "company" && (
                      <div className="space-y-2">
                        <Label htmlFor="company">Company *</Label>
                        <Select value={companyId} onValueChange={setCompanyId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a company" />
                          </SelectTrigger>
                          <SelectContent>
                            {companies.map((company) => (
                              <SelectItem key={company.id} value={company.id}>
                                {company.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="orderNotes">Notes</Label>
                      <Textarea
                        id="orderNotes"
                        value={orderNotes}
                        onChange={(e) => setOrderNotes(e.target.value)}
                        placeholder="Optional notes..."
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setAddOrderOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddOrder}>Add Product</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No products added yet. Click "Add Product" to get started.
              </div>
            ) : (
              <div className="space-y-6">
                {/* Company Orders */}
                {companyOrders.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-success">Company Orders</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>SKU</TableHead>
                          <TableHead>Product Name</TableHead>
                          <TableHead>Company</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {companyOrders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-medium">{order.sku}</TableCell>
                            <TableCell>{order.product_name}</TableCell>
                            <TableCell>{order.companies?.name || "N/A"}</TableCell>
                            <TableCell>{order.quantity}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{order.status}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {/* Amazon Orders */}
                {amazonOrders.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-warning">Amazon Stock</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>SKU</TableHead>
                          <TableHead>Product Name</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {amazonOrders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-medium">{order.sku}</TableCell>
                            <TableCell>{order.product_name}</TableCell>
                            <TableCell>{order.quantity}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{order.status}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ShipmentDetail;
