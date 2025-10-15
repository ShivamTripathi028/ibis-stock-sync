import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";

const CreateShipment = () => {
  const navigate = useNavigate();
  const [shipmentNumber, setShipmentNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("shipments")
        .insert([
          {
            shipment_number: shipmentNumber,
            notes: notes || null,
            status: "open",
          },
        ])
        .select()
        .single();

      if (error) throw error;

      toast.success("Shipment created successfully!");
      navigate(`/shipments/${data.id}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to create shipment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/shipments">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Create New Shipment</h1>
            <p className="text-muted-foreground mt-1">
              Enter shipment details to get started
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Shipment Information</CardTitle>
            <CardDescription>
              Provide the shipment number and any additional notes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="shipmentNumber">
                  Shipment Number <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="shipmentNumber"
                  placeholder="e.g., SHP-0012"
                  value={shipmentNumber}
                  onChange={(e) => setShipmentNumber(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Must be unique and easily identifiable
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any relevant notes about this shipment..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? "Creating..." : "Create Shipment"}
                </Button>
                <Link to="/shipments" className="flex-1">
                  <Button type="button" variant="outline" className="w-full">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default CreateShipment;
