
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface PaymentReceiptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  payment: {
    id: number;
    client: string;
    invoice: string;
    amount: string;
    date: string;
    method: string;
  } | null;
}

export function PaymentReceiptDialog({ isOpen, onClose, payment }: PaymentReceiptDialogProps) {
  if (!payment) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Payment Receipt</DialogTitle>
          <DialogDescription>
            Receipt details for payment #{payment.id}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="border-b pb-4">
            <div className="text-2xl font-bold text-center">Receipt</div>
            <div className="text-center text-muted-foreground">
              {format(new Date(), "MMMM d, yyyy")}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="font-medium">Invoice:</span>
              <span>{payment.invoice}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Client:</span>
              <span>{payment.client}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Amount:</span>
              <span className="font-bold">{payment.amount}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Payment Date:</span>
              <span>{payment.date}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Payment Method:</span>
              <span>{payment.method}</span>
            </div>
          </div>

          <div className="border-t pt-4 text-center">
            <div className="text-sm text-muted-foreground">
              Thank you for your business!
            </div>
          </div>
        </div>

        <DialogFooter className="space-x-2">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Close
          </Button>
          <Button
            onClick={() => {
              window.print();
            }}
          >
            Print Receipt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
