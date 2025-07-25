"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/hooks/use-cart";
import { formatRupiah } from "@/lib/currency";

import { useAuth } from "@/hooks/use-auth";
import { Textarea } from "@/components/ui/textarea";
import { createOrder, getImagePath } from "@/lib/api";
import { CheckoutDetailRequest, CheckoutRequest } from "@/types";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart, clearCart } = useCart();
  const { member, user } = useAuth();
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const close = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (member) {
      setAddress(member?.address || "");
    }
  }, [member]);

  const handleCheckout = async () => {
    if (!member || !user) {
      toast.error("You must be logged in to checkout.", { richColors: true });
      return;
    }
    if (!address || address.trim().length < 5) {
      toast.error("Please enter a valid address.", { richColors: true });
      return;
    }
    if (cart.length === 0) {
      toast.error("Your cart is empty.", { richColors: true });
      return;
    }

    setLoading(true);

    const checkoutDetailRequests: CheckoutDetailRequest[] = cart.map(
      (item) => ({
        productId: item.id,
        qty: item.quantity,
        subtotal: item.price * item.quantity,
        notes: "",
      })
    );

    const checkoutRequest: CheckoutRequest = {
      member: user ? user.id : "",
      customerAddress: address,
      totalAmount: cart.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      ),
      status: "PROSES",
      checkoutDetailRequests,
    };

    try {
      await createOrder(checkoutRequest);
      clearCart();
      localStorage.removeItem("cart");
      toast.success("Checkout successful! ", {
        richColors: true,
        description: "Your order has been placed.",
      });

      router.push("/account/orders");
    } catch (error) {
      toast.error("Checkout failed! ", {
        richColors: true,
        description: "Please try again.",
      });
    } finally {
      setLoading(false);
      close.current?.click();
    }
  };

  const subtotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
  const total = subtotal;

  if (cart.length === 0) {
    return (
      <div className="container px-4 md:px-6 py-12 flex flex-col items-center justify-center min-h-[60vh]">
        <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
        <p className="text-muted-foreground mb-6">
          Looks like you haven't added anything to your cart yet.
        </p>
        <Link href="/products">
          <Button>Continue Shopping</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div className="container px-4 md:px-6 py-6">
        <div className="flex items-center gap-2 mb-6">
          <Link href="/products">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Continue Shopping
            </Button>
          </Link>
        </div>
        <h1 className="text-3xl font-bold mb-6">Shopping Cart</h1>
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="rounded-lg border shadow-sm">
              <div className="p-6">
                <div className="grid gap-6">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="grid sm:grid-cols-[120px_1fr] gap-4"
                    >
                      <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
                        <Image
                          src={
                            item.images && item.images.length > 0
                              ? getImagePath(item.images[0], 120, 120)
                              : "/placeholder.svg?height=120&width=120"
                          }
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 120px, 120px"
                        />
                      </div>
                      <div className="grid gap-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-medium">{item.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {formatRupiah(item.price)}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground"
                            onClick={() => removeFromCart(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Remove</span>
                          </Button>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              updateQuantity(
                                item.id,
                                Math.max(1, item.quantity - 1)
                              )
                            }
                          >
                            <Minus className="h-3 w-3" />
                            <span className="sr-only">Decrease</span>
                          </Button>
                          <span className="w-8 text-center text-sm">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity + 1)
                            }
                          >
                            <Plus className="h-3 w-3" />
                            <span className="sr-only">Increase</span>
                          </Button>
                          <div className="ml-auto font-medium">
                            {formatRupiah(item.price * item.quantity)}
                          </div>
                        </div>
                      </div>
                      <Separator className="col-span-full" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div>
            <div className="rounded-lg border shadow-sm">
              <div className="p-6">
                <h2 className="font-semibold text-lg mb-4">Order Summary</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatRupiah(subtotal)}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between font-medium">
                    <span>Total</span>
                    <span>{formatRupiah(total)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Textarea
                      placeholder="Enter Your Address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      required
                    />
                  </div>
                  <Dialog>
                    <DialogTrigger asChild ref={close}>
                      <Button className="w-full" size="lg">
                        Checkout
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Confirm Checkout</DialogTitle>
                        <DialogDescription>
                          Before you proceed, please confirm your details and
                          address. Ensure everything is correct to avoid any
                          issues with your order.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4">
                        <div className="grid gap-3">
                          <p className="text-yellow-500 font-bold">Must Do:</p>
                          <Label>
                            &#8226; Make sure you're address are right!
                          </Label>
                        </div>
                        <div className="grid gap-3">
                          <p className="text-blue-500 font-bold">Info:</p>

                          <Label>
                            &#8226; System will notify shop staff after you
                            click "Confirm Checkout" button
                          </Label>

                          <Label>
                            &#8226; Currently available payment method is COD,
                            but our staff will also bring QRIS code for you to
                            pay via QRIS at your address
                          </Label>

                          <Label>
                            &#8226; You can track your order status in your
                            account page
                          </Label>
                        </div>
                        <div className="grid gap-3">
                          <p className="text-red-500 font-bold">Warning:</p>

                          <Label>
                            &#8226; Any unwanted behavior such as harrassing our
                            staff, cancelling orders after confirming orders, or
                            not paying after receiving the order, etc will not
                            be tolerated and result in a ban from our system
                          </Label>
                        </div>
                      </div>
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button variant="outline">Wait A Minute!</Button>
                        </DialogClose>
                        <Button onClick={handleCheckout} disabled={loading}>
                          {loading ? "Processing..." : "Confirm Checkout"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
