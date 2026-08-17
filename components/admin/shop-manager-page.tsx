import * as React from "react";
import { Alert, Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner-native";

import { Plus, Search, Trash2, Upload, X } from "@/components/icons";
import {
  adminCreateProduct,
  adminListProducts,
  adminRemoveProduct,
  adminUpdateProduct,
  type AdminProduct,
  type ProductInput,
} from "@/lib/api/products-admin";
import { listTeams } from "@/lib/api/teams";
import { listShows } from "@/lib/api/shows";
import { pickAndUploadImage, uploadErrorMessage } from "@/lib/api/uploads";
import { useAuth } from "@/components/providers";
import { hasMinRole } from "@/lib/auth/roles";
import type { Product, ProductVariant } from "@/lib/types";
import { ImageWithFallback } from "@/components/common/image-with-fallback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/spinner";

import { useTokens } from "@/lib/theme/tokens";

import { ListState } from "./list-state";
import { PageHeader } from "./page-header";
import { StatusBadge } from "./status-badge";
import { formatNgn } from "./utils";

/**
 * The shop.
 *
 * The catalogue half: what is for sale, what it costs, what sizes exist and how
 * many of each are left. Orders have their own screen and are not repeated here.
 *
 * Reading is a support job and writing is not, which is how the API is gated,
 * so support sees the list and none of the buttons. Anything they could press
 * would answer 403.
 */

const CATEGORIES: Product["category"][] = [
  "jersey",
  "apparel",
  "accessory",
  "digital",
  "collectible",
];

interface ProductDraft {
  id: string | null;
  name: string;
  description: string;
  category: Product["category"];
  priceNgn: string;
  images: string[];
  variants: ProductVariant[];
  featured: boolean;
  active: boolean;
  teamId: string;
  showId: string;
  inventory: string;
}

function draftFrom(product: AdminProduct | null): ProductDraft {
  return {
    id: product?.id ?? null,
    name: product?.name ?? "",
    description: product?.description ?? "",
    category: product?.category ?? "apparel",
    priceNgn: product ? String(product.priceNgn) : "",
    images: product?.images ?? [],
    variants: product?.variants ?? [],
    featured: product?.featured ?? false,
    active: product?.active ?? true,
    teamId: product?.teamId ?? "none",
    showId: product?.showId ?? "none",
    inventory: product ? String(product.inventory) : "0",
  };
}

/** `Large` becomes `large`, so a variant id is stable and readable in an order. */
function variantId(label: string): string {
  return (
    label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || `v${Date.now()}`
  );
}

function stockOf(product: AdminProduct): number {
  return product.variants.length > 0
    ? product.variants.reduce((sum, v) => sum + v.inventory, 0)
    : product.inventory;
}

export function ShopManagerPage() {
  const t = useTokens();
  const queryClient = useQueryClient();
  const { role } = useAuth();
  const canEdit = hasMinRole(role, "admin");

  const [search, setSearch] = React.useState("");
  const [showHidden, setShowHidden] = React.useState(true);
  const [draft, setDraft] = React.useState<ProductDraft | null>(null);

  const productsQ = useQuery({
    queryKey: ["admin", "shop-products"],
    queryFn: adminListProducts,
    staleTime: 30_000,
  });

  const products = productsQ.data?.products ?? [];

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (!showHidden && !p.active) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q)
      );
    });
  }, [products, search, showHidden]);

  const refresh = React.useCallback(
    () => queryClient.invalidateQueries({ queryKey: ["admin", "shop-products"] }),
    [queryClient],
  );

  const save = useMutation({
    mutationFn: async (input: ProductDraft) => {
      const payload: ProductInput = {
        name: input.name.trim(),
        description: input.description.trim(),
        category: input.category,
        priceNgn: Math.max(0, Math.round(Number(input.priceNgn) || 0)),
        images: input.images.filter(Boolean),
        variants: input.variants,
        featured: input.featured,
        active: input.active,
        teamId: input.teamId === "none" ? null : input.teamId,
        showId: input.showId === "none" ? null : input.showId,
        inventory: Math.max(0, Math.round(Number(input.inventory) || 0)),
      };
      return input.id
        ? adminUpdateProduct(input.id, payload)
        : adminCreateProduct(payload);
    },
    onSuccess: (_p, input) => {
      toast.success(input.id ? "Product saved" : "Product added to the shop");
      setDraft(null);
      refresh();
    },
    onError: (err) =>
      toast.error("Could not save the product", {
        description: err instanceof Error ? err.message : "Unknown error",
      }),
  });

  const remove = useMutation({
    mutationFn: (product: AdminProduct) => adminRemoveProduct(product.id),
    onSuccess: (result) => {
      // The server chooses between a delete and a deactivation, so the message
      // says which one happened rather than guessing.
      toast.success(result.message ?? "Removed from the shop");
      refresh();
    },
    onError: (err) =>
      toast.error("Could not remove it", {
        description: err instanceof Error ? err.message : "Unknown error",
      }),
  });

  function confirmRemove(product: AdminProduct) {
    Alert.alert(
      "Take this off the shop?",
      `"${product.name}" stops being for sale. If anybody has ordered it the row is kept and simply hidden, so past orders still say what was bought.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Take it off",
          style: "destructive",
          onPress: () => remove.mutate(product),
        },
      ],
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <PageHeader
          title="Shop"
          description="What is for sale, what it costs, and how many are left. Orders are on their own page."
          actions={
            canEdit ? (
              <Button className="bg-brand" onPress={() => setDraft(draftFrom(null))}>
                <Plus size={14} color={t.bg} />
                <Text className="text-sm font-semibold text-background">
                  New product
                </Text>
              </Button>
            ) : null
          }
        />

        <View className="mb-3 flex-row items-center gap-2 rounded-lg bg-card px-3">
          <Search size={14} color={t.muted} />
          <Input
            value={search}
            onChangeText={setSearch}
            placeholder="Search products"
            className="h-10 flex-1 bg-transparent px-0"
          />
        </View>

        <View className="mb-4 flex-row items-center gap-2">
          <Switch checked={showHidden} onCheckedChange={setShowHidden} />
          <Text className="text-xs text-muted-foreground">Include hidden</Text>
          <Text className="ml-auto text-xs text-muted-foreground">
            {filtered.length} product{filtered.length === 1 ? "" : "s"}
          </Text>
        </View>

        <ListState
          isPending={productsQ.isPending}
          isError={productsQ.isError}
          error={productsQ.error}
          isEmpty={filtered.length === 0}
          emptyMessage={
            search.trim()
              ? "Nothing matches that search."
              : "Nothing in the shop yet. Add a product and it appears on the site."
          }
          onRetry={() => productsQ.refetch()}
        />

        {filtered.map((product) => {
          const stock = stockOf(product);
          return (
            <View
              key={product.id}
              className="mb-2 flex-row items-center gap-3 rounded-xl bg-card p-3"
            >
              <View className="h-14 w-14 overflow-hidden rounded-lg bg-muted">
                <ImageWithFallback
                  source={product.images[0] ?? ""}
                  fallbackLabel={product.name}
                  tintSeed={product.id}
                  // The placeholder branch is a bare View, so it needs a size
                  // of its own or it collapses inside its box.
                  style={{ width: "100%", height: "100%" }}
                />
              </View>
              <View className="min-w-0 flex-1">
                <Text
                  numberOfLines={1}
                  className="text-sm font-medium text-foreground"
                >
                  {product.name}
                </Text>
                <Text numberOfLines={1} className="text-xs capitalize text-muted-foreground">
                  {product.category}
                  {product.variants.length > 0
                    ? ` · ${product.variants.length} option${
                        product.variants.length === 1 ? "" : "s"
                      }`
                    : ""}
                </Text>
                <Text
                  className="text-xs text-muted-foreground"
                  style={{ fontVariant: ["tabular-nums"] }}
                >
                  {formatNgn(product.priceNgn)} ·{" "}
                  {stock === 0 ? "Out of stock" : `${stock} left`}
                </Text>
              </View>
              <View className="items-end gap-1.5">
                <View className="flex-row items-center gap-1.5">
                  {product.featured ? (
                    <StatusBadge tone="emerald">Featured</StatusBadge>
                  ) : null}
                  <StatusBadge tone={product.active ? "blue" : "neutral"}>
                    {product.active ? "On sale" : "Hidden"}
                  </StatusBadge>
                </View>
                {canEdit ? (
                  <View className="flex-row items-center gap-1">
                    <Pressable
                      onPress={() => setDraft(draftFrom(product))}
                      hitSlop={8}
                      accessibilityLabel={`Edit ${product.name}`}
                      className="rounded-lg bg-accent px-2.5 py-1.5 active:opacity-70"
                    >
                      <Text className="text-xs font-semibold text-foreground">
                        Edit
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => confirmRemove(product)}
                      hitSlop={8}
                      accessibilityLabel={`Remove ${product.name}`}
                      className="rounded-lg bg-accent p-1.5 active:opacity-70"
                    >
                      <Trash2 size={14} color={t.danger} />
                    </Pressable>
                  </View>
                ) : null}
              </View>
            </View>
          );
        })}
      </ScrollView>

      <ProductSheet
        draft={draft}
        submitting={save.isPending}
        onChange={setDraft}
        onClose={() => setDraft(null)}
        onSubmit={(d) => save.mutate(d)}
      />
    </View>
  );
}

function ProductSheet({
  draft,
  submitting,
  onChange,
  onClose,
  onSubmit,
}: {
  draft: ProductDraft | null;
  submitting: boolean;
  onChange: (draft: ProductDraft) => void;
  onClose: () => void;
  onSubmit: (draft: ProductDraft) => void;
}) {
  const t = useTokens();
  const [uploading, setUploading] = React.useState(false);

  const teamsQ = useQuery({
    queryKey: ["teams"],
    queryFn: () => listTeams(),
    staleTime: 5 * 60_000,
  });

  // Linking a product to a show is what puts it on that show's page. The list
  // is small and rarely changes, so it is fetched once with the form.
  const showsQ = useQuery({
    queryKey: ["shows", "for-products"],
    queryFn: () => listShows(),
    staleTime: 5 * 60_000,
  });

  async function addPhoto() {
    if (!draft) return;
    try {
      setUploading(true);
      const url = await pickAndUploadImage();
      if (url) onChange({ ...draft, images: [...draft.images, url] });
    } catch (err) {
      toast.error("Upload failed", { description: uploadErrorMessage(err) });
    } finally {
      setUploading(false);
    }
  }

  return (
    <Modal
      visible={draft !== null}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable onPress={onClose} className="flex-1 justify-end bg-black/60">
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="max-h-[92%] rounded-t-2xl bg-background"
        >
          {draft ? (
            <ScrollView
              contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
              keyboardShouldPersistTaps="handled"
            >
              <View className="mb-4 flex-row items-start justify-between">
                <View className="flex-1 pr-3">
                  <Text className="text-lg font-bold text-foreground">
                    {draft.id ? "Edit product" : "New product"}
                  </Text>
                  <Text className="mt-1 text-xs leading-5 text-muted-foreground">
                    {draft.id
                      ? "The shop URL was set when this was created and does not move when the name changes."
                      : "The shop URL comes from the name."}
                  </Text>
                </View>
                <Pressable onPress={onClose} hitSlop={12} accessibilityLabel="Close">
                  <X size={20} color={t.muted} />
                </Pressable>
              </View>

              <SheetField label="Name">
                <Input
                  value={draft.name}
                  onChangeText={(name) => onChange({ ...draft, name })}
                  placeholder="EVO TV home jersey"
                  className="bg-card"
                />
              </SheetField>

              <SheetField label="Description">
                <Input
                  value={draft.description}
                  onChangeText={(description) => onChange({ ...draft, description })}
                  multiline
                  placeholder="What it is, what it is made of"
                  className="min-h-[72px] bg-card"
                />
              </SheetField>

              <View className="mb-3 flex-row gap-3">
                <View className="flex-1">
                  <Label className="mb-1.5 text-xs text-muted-foreground">
                    Category
                  </Label>
                  <Select
                    value={draft.category}
                    onValueChange={(v) =>
                      onChange({ ...draft, category: v as Product["category"] })
                    }
                  >
                    <SelectTrigger className="bg-card">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c.charAt(0).toUpperCase() + c.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </View>
                <View className="flex-1">
                  <Label className="mb-1.5 text-xs text-muted-foreground">
                    Price, naira
                  </Label>
                  <Input
                    value={draft.priceNgn}
                    onChangeText={(priceNgn) => onChange({ ...draft, priceNgn })}
                    keyboardType="number-pad"
                    placeholder="15000"
                    className="bg-card"
                  />
                </View>
              </View>

              <SheetField label="Team">
                <Select
                  value={draft.teamId}
                  onValueChange={(teamId) => onChange({ ...draft, teamId })}
                >
                  <SelectTrigger className="bg-card">
                    <SelectValue placeholder="Not team merchandise" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not team merchandise</SelectItem>
                    {(teamsQ.data ?? []).map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </SheetField>

              <SheetField label="Show">
                <Select
                  value={draft.showId}
                  onValueChange={(showId) => onChange({ ...draft, showId })}
                >
                  <SelectTrigger className="bg-card">
                    <SelectValue placeholder="Not tied to a show" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not tied to a show</SelectItem>
                    {(showsQ.data ?? []).map((show) => (
                      <SelectItem key={show.id} value={show.id}>
                        {show.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Text className="mt-1 text-xs text-muted-foreground">
                  Puts this product on that show{"'"}s page.
                </Text>
              </SheetField>

              <SheetField label="Stock">
                <Input
                  value={draft.inventory}
                  onChangeText={(inventory) => onChange({ ...draft, inventory })}
                  keyboardType="number-pad"
                  editable={draft.variants.length === 0}
                  className="bg-card"
                />
                <Text className="mt-1 text-xs text-muted-foreground">
                  {draft.variants.length > 0
                    ? "Counted per option below."
                    : "Zero shows as out of stock."}
                </Text>
              </SheetField>

              <SheetField label="Photos">
                {draft.images.map((image, index) => (
                  <View key={`${image}-${index}`} className="mb-2 flex-row items-center gap-3">
                    <View
                      className="overflow-hidden rounded-lg bg-card"
                      style={{ height: 56, width: 56 }}
                    >
                      <ImageWithFallback
                        source={image}
                        tintSeed={image}
                        style={{ width: "100%", height: "100%" }}
                      />
                    </View>
                    <Text
                      numberOfLines={1}
                      className="min-w-0 flex-1 text-xs text-muted-foreground"
                    >
                      {index === 0 ? "Main photo" : `Photo ${index + 1}`}
                    </Text>
                    <Pressable
                      onPress={() =>
                        onChange({
                          ...draft,
                          images: draft.images.filter((_, i) => i !== index),
                        })
                      }
                      hitSlop={8}
                      accessibilityLabel="Remove this photo"
                      className="rounded-lg bg-card p-2 active:opacity-70"
                    >
                      <X size={14} color={t.danger} />
                    </Pressable>
                  </View>
                ))}
                <Pressable
                  onPress={addPhoto}
                  disabled={uploading || draft.images.length >= 10}
                  className={`flex-row items-center justify-center gap-2 rounded-lg bg-card px-3 py-2.5 ${
                    uploading || draft.images.length >= 10 ? "opacity-60" : ""
                  }`}
                >
                  {uploading ? (
                    <Spinner size="small" />
                  ) : (
                    <Upload size={14} color={t.brand} />
                  )}
                  <Text className="text-sm text-foreground">
                    {uploading ? "Uploading…" : "Add a photo"}
                  </Text>
                </Pressable>
              </SheetField>

              <SheetField label="Options">
                <Text className="mb-2 text-xs leading-5 text-muted-foreground">
                  Sizes or colourways. Each carries its own price and its own
                  stock, because running out of medium is not running out of the
                  shirt.
                </Text>

                {draft.variants.map((v, index) => (
                  <View key={index} className="mb-2 rounded-lg bg-card p-3">
                    <View className="flex-row items-center gap-2">
                      <Input
                        value={v.label}
                        placeholder="Large"
                        className="flex-1 bg-background"
                        onChangeText={(label) =>
                          onChange({
                            ...draft,
                            variants: draft.variants.map((item, i) =>
                              i === index
                                ? { ...item, label, id: variantId(label) }
                                : item,
                            ),
                          })
                        }
                      />
                      <Pressable
                        onPress={() =>
                          onChange({
                            ...draft,
                            variants: draft.variants.filter((_, i) => i !== index),
                          })
                        }
                        hitSlop={8}
                        accessibilityLabel="Remove this option"
                        className="rounded-lg bg-background p-2 active:opacity-70"
                      >
                        <Trash2 size={14} color={t.danger} />
                      </Pressable>
                    </View>
                    <View className="mt-2 flex-row gap-2">
                      <View className="flex-1">
                        <Label className="mb-1 text-xs text-muted-foreground">
                          Price
                        </Label>
                        <Input
                          value={String(v.priceNgn)}
                          keyboardType="number-pad"
                          className="bg-background"
                          onChangeText={(text) =>
                            onChange({
                              ...draft,
                              variants: draft.variants.map((item, i) =>
                                i === index
                                  ? { ...item, priceNgn: Number(text) || 0 }
                                  : item,
                              ),
                            })
                          }
                        />
                      </View>
                      <View className="flex-1">
                        <Label className="mb-1 text-xs text-muted-foreground">
                          Stock
                        </Label>
                        <Input
                          value={String(v.inventory)}
                          keyboardType="number-pad"
                          className="bg-background"
                          onChangeText={(text) =>
                            onChange({
                              ...draft,
                              variants: draft.variants.map((item, i) =>
                                i === index
                                  ? { ...item, inventory: Number(text) || 0 }
                                  : item,
                              ),
                            })
                          }
                        />
                      </View>
                    </View>
                  </View>
                ))}

                <Pressable
                  onPress={() =>
                    onChange({
                      ...draft,
                      variants: [
                        ...draft.variants,
                        {
                          id: `option-${draft.variants.length + 1}`,
                          label: "",
                          priceNgn: Number(draft.priceNgn) || 0,
                          inventory: 0,
                        },
                      ],
                    })
                  }
                  className="flex-row items-center justify-center gap-2 rounded-lg bg-card px-3 py-2.5 active:opacity-70"
                >
                  <Plus size={14} color={t.brand} />
                  <Text className="text-sm text-foreground">Add an option</Text>
                </Pressable>
              </SheetField>

              <View className="mb-2 flex-row items-center justify-between rounded-lg bg-card px-3 py-3">
                <View className="flex-1 pr-3">
                  <Text className="text-sm font-medium text-foreground">
                    On sale
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    Off hides it from the shop without losing it.
                  </Text>
                </View>
                <Switch
                  checked={draft.active}
                  onCheckedChange={(active) => onChange({ ...draft, active })}
                />
              </View>

              <View className="mb-2 flex-row items-center justify-between rounded-lg bg-card px-3 py-3">
                <Text className="flex-1 pr-3 text-sm font-medium text-foreground">
                  Featured on the shop front
                </Text>
                <Switch
                  checked={draft.featured}
                  onCheckedChange={(featured) => onChange({ ...draft, featured })}
                />
              </View>

              <View className="mt-3 flex-row gap-2">
                <Button variant="secondary" className="flex-1" onPress={onClose}>
                  <Text className="text-sm font-medium text-foreground">
                    Cancel
                  </Text>
                </Button>
                <Button
                  disabled={draft.name.trim().length < 2 || submitting}
                  className="flex-1 bg-brand"
                  onPress={() => onSubmit(draft)}
                >
                  <Text className="text-sm font-semibold text-background">
                    {submitting
                      ? "Saving…"
                      : draft.id
                        ? "Save product"
                        : "Add to the shop"}
                  </Text>
                </Button>
              </View>
            </ScrollView>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function SheetField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View className="mb-3">
      <Label className="mb-1.5 text-xs text-muted-foreground">{label}</Label>
      {children}
    </View>
  );
}
