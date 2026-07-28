"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useFieldArray, useForm, useWatch } from "react-hook-form"
import { GripVertical, Loader2, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/native-select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { ApiError } from "@/lib/api/errors"
import {
  LOCATION_LABELS,
  QUESTION_LABELS,
  type EventType,
} from "@/lib/api/schedule-types"
import type { EventTypeInput } from "@/lib/hooks/use-event-types"
import {
  EVENT_TYPE_DEFAULTS,
  eventTypeSchema,
  slugify,
  type EventTypeFormValues,
} from "./event-type-schema"

interface Props {
  /** Absent when creating. */
  eventType?: EventType
  onSubmit: (input: EventTypeInput) => Promise<unknown>
  submitLabel: string
}

export function EventTypeForm({ eventType, onSubmit, submitLabel }: Props) {
  const router = useRouter()
  const [autoSlug, setAutoSlug] = React.useState(!eventType)

  const form = useForm<EventTypeFormValues>({
    resolver: zodResolver(eventTypeSchema),
    defaultValues: eventType
      ? toFormValues(eventType)
      : EVENT_TYPE_DEFAULTS,
  })

  const questions = useFieldArray({
    control: form.control,
    name: "questions",
  })

  const errors = form.formState.errors

  // One useWatch subscription rather than several form.watch() calls: watch()
  // cannot be memoized, so the React Compiler bails out of optimising the whole
  // component when it appears in the render body.
  const watched = useWatch({ control: form.control })
  const locationType = watched.locationType
  const kind = watched.kind

  async function submit(values: EventTypeFormValues) {
    try {
      await onSubmit(toApiInput(values))
      toast.success(eventType ? "Event type saved" : "Event type created")
      router.push("/event-types")
    } catch (error) {
      if (error instanceof ApiError) {
        // A duplicate slug is the one conflict worth pinning to its field
        // rather than dropping in a toast the user has to correlate.
        if (error.status === 409) {
          form.setError("slug", { message: error.message })
          return
        }

        if (error.isValidation) {
          toast.error(error.messages.join(" · "))
          return
        }

        toast.error(error.message)
        return
      }

      toast.error("Something went wrong")
    }
  }

  return (
    <form onSubmit={form.handleSubmit(submit)} className="space-y-6">
      <Card>
        <CardContent>
          <FieldSet>
            <FieldLegend>Basics</FieldLegend>
            <FieldGroup>
              <Field data-invalid={Boolean(errors.name)}>
                <FieldLabel htmlFor="name">Name</FieldLabel>
                <Input
                  id="name"
                  placeholder="Intro call"
                  {...form.register("name", {
                    onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
                      // Stop mirroring once the user edits the slug by hand.
                      if (autoSlug) {
                        form.setValue("slug", slugify(event.target.value), {
                          shouldValidate: false,
                        })
                      }
                    },
                  })}
                />
                <FieldError errors={[errors.name]} />
              </Field>

              <Field data-invalid={Boolean(errors.slug)}>
                <FieldLabel htmlFor="slug">Booking link</FieldLabel>
                <Input
                  id="slug"
                  placeholder="intro"
                  {...form.register("slug", {
                    onChange: () => setAutoSlug(false),
                  })}
                />
                <FieldDescription>
                  Appears in the URL: /book/your-username/
                  <strong>{watched.slug || "slug"}</strong>
                </FieldDescription>
                <FieldError errors={[errors.slug]} />
              </Field>

              <Field>
                <FieldLabel htmlFor="description">Description</FieldLabel>
                <Textarea
                  id="description"
                  rows={3}
                  placeholder="What should invitees expect?"
                  {...form.register("description")}
                />
                <FieldError errors={[errors.description]} />
              </Field>

              <Field orientation="responsive">
                <Field data-invalid={Boolean(errors.durationMinutes)}>
                  <FieldLabel htmlFor="durationMinutes">
                    Duration (minutes)
                  </FieldLabel>
                  <Input
                    id="durationMinutes"
                    type="number"
                    min={5}
                    max={1440}
                    {...form.register("durationMinutes", { valueAsNumber: true })}
                  />
                  <FieldError errors={[errors.durationMinutes]} />
                </Field>

                <Field>
                  <FieldLabel htmlFor="color">Colour</FieldLabel>
                  <Input
                    id="color"
                    type="color"
                    className="h-9 w-full p-1"
                    {...form.register("color")}
                  />
                  <FieldError errors={[errors.color]} />
                </Field>
              </Field>
            </FieldGroup>
          </FieldSet>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <FieldSet>
            <FieldLegend>Where it happens</FieldLegend>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="locationType">Location</FieldLabel>
                <NativeSelect
                  id="locationType"
                  {...form.register("locationType")}
                >
                  {Object.entries(LOCATION_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </NativeSelect>
              </Field>

              {locationType !== "google_meet" && (
                <Field>
                  <FieldLabel htmlFor="locationDetails">
                    {locationType === "in_person"
                      ? "Address"
                      : locationType === "phone"
                        ? "Phone number"
                        : "Details"}
                  </FieldLabel>
                  <Input
                    id="locationDetails"
                    {...form.register("locationDetails")}
                  />
                  <FieldError errors={[errors.locationDetails]} />
                </Field>
              )}

              <Field>
                <FieldLabel htmlFor="kind">Type</FieldLabel>
                <NativeSelect id="kind" {...form.register("kind")}>
                  <option value="one_on_one">One-on-one</option>
                  <option value="group">Group</option>
                  <option value="collective">Collective</option>
                  <option value="round_robin">Round robin</option>
                </NativeSelect>
                {kind !== "one_on_one" && (
                  <FieldDescription>
                    Only one-on-one is fully wired today — group, collective and
                    round-robin are stored but still behave as one-on-one when a
                    slot is booked.
                  </FieldDescription>
                )}
              </Field>

              {kind === "group" && (
                <Field data-invalid={Boolean(errors.capacity)}>
                  <FieldLabel htmlFor="capacity">Capacity</FieldLabel>
                  <Input
                    id="capacity"
                    type="number"
                    min={1}
                    max={100}
                    {...form.register("capacity", { valueAsNumber: true })}
                  />
                  <FieldError errors={[errors.capacity]} />
                </Field>
              )}
            </FieldGroup>
          </FieldSet>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <FieldSet>
            <FieldLegend>Scheduling rules</FieldLegend>
            <FieldGroup>
              <Field orientation="responsive">
                <Field data-invalid={Boolean(errors.bufferBeforeMin)}>
                  <FieldLabel htmlFor="bufferBeforeMin">
                    Buffer before (min)
                  </FieldLabel>
                  <Input
                    id="bufferBeforeMin"
                    type="number"
                    min={0}
                    max={240}
                    {...form.register("bufferBeforeMin", { valueAsNumber: true })}
                  />
                  <FieldError errors={[errors.bufferBeforeMin]} />
                </Field>
                <Field data-invalid={Boolean(errors.bufferAfterMin)}>
                  <FieldLabel htmlFor="bufferAfterMin">
                    Buffer after (min)
                  </FieldLabel>
                  <Input
                    id="bufferAfterMin"
                    type="number"
                    min={0}
                    max={240}
                    {...form.register("bufferAfterMin", { valueAsNumber: true })}
                  />
                  <FieldError errors={[errors.bufferAfterMin]} />
                </Field>
              </Field>

              <Field orientation="responsive">
                <Field data-invalid={Boolean(errors.minNoticeMin)}>
                  <FieldLabel htmlFor="minNoticeMin">
                    Minimum notice (min)
                  </FieldLabel>
                  <Input
                    id="minNoticeMin"
                    type="number"
                    min={0}
                    max={10080}
                    {...form.register("minNoticeMin", { valueAsNumber: true })}
                  />
                  <FieldDescription>
                    How far ahead an invitee must book. 60 = one hour.
                  </FieldDescription>
                  <FieldError errors={[errors.minNoticeMin]} />
                </Field>
                <Field data-invalid={Boolean(errors.rollingDays)}>
                  <FieldLabel htmlFor="rollingDays">
                    Bookable window (days)
                  </FieldLabel>
                  <Input
                    id="rollingDays"
                    type="number"
                    min={1}
                    max={365}
                    {...form.register("rollingDays", { valueAsNumber: true })}
                  />
                  <FieldError errors={[errors.rollingDays]} />
                </Field>
              </Field>

              <Field data-invalid={Boolean(errors.slotIncrementMin)}>
                <FieldLabel htmlFor="slotIncrementMin">
                  Slot interval (min)
                </FieldLabel>
                <Input
                  id="slotIncrementMin"
                  type="number"
                  min={5}
                  max={120}
                  {...form.register("slotIncrementMin", { valueAsNumber: true })}
                />
                <FieldDescription>
                  How often a start time is offered. Smaller than the duration
                  means overlapping options.
                </FieldDescription>
                <FieldError errors={[errors.slotIncrementMin]} />
              </Field>
            </FieldGroup>
          </FieldSet>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <FieldSet>
            <FieldLegend>Questions for invitees</FieldLegend>
            <FieldDescription>
              Name and email are always collected. Add anything else you need.
            </FieldDescription>

            <div className="mt-4 space-y-3">
              {questions.fields.map((field, index) => (
                <div
                  key={field.id}
                  className="border-border rounded-xl border p-3"
                >
                  <div className="flex items-start gap-2">
                    <GripVertical className="text-muted-foreground mt-2 h-4 w-4 shrink-0" />
                    <div className="min-w-0 flex-1 space-y-3">
                      <Field
                        data-invalid={Boolean(
                          errors.questions?.[index]?.label
                        )}
                      >
                        <FieldLabel htmlFor={`questions.${index}.label`}>
                          Question
                        </FieldLabel>
                        <Input
                          id={`questions.${index}.label`}
                          placeholder="What would you like to discuss?"
                          {...form.register(`questions.${index}.label`)}
                        />
                        <FieldError
                          errors={[errors.questions?.[index]?.label]}
                        />
                      </Field>

                      <Field orientation="responsive">
                        <Field>
                          <FieldLabel htmlFor={`questions.${index}.qtype`}>
                            Answer type
                          </FieldLabel>
                          <NativeSelect
                            id={`questions.${index}.qtype`}
                            {...form.register(`questions.${index}.qtype`)}
                          >
                            {Object.entries(QUESTION_LABELS).map(
                              ([value, label]) => (
                                <option key={value} value={value}>
                                  {label}
                                </option>
                              )
                            )}
                          </NativeSelect>
                        </Field>

                        <Field orientation="horizontal">
                          <Checkbox
                            id={`questions.${index}.isRequired`}
                            checked={
                              watched.questions?.[index]?.isRequired ?? false
                            }
                            onCheckedChange={(checked) =>
                              form.setValue(
                                `questions.${index}.isRequired`,
                                checked === true
                              )
                            }
                          />
                          <FieldLabel
                            htmlFor={`questions.${index}.isRequired`}
                            className="font-normal"
                          >
                            Required
                          </FieldLabel>
                        </Field>
                      </Field>

                      {watched.questions?.[index]?.qtype === "select" && (
                        <Field>
                          <FieldLabel htmlFor={`questions.${index}.optionsRaw`}>
                            Choices
                          </FieldLabel>
                          <Input
                            id={`questions.${index}.optionsRaw`}
                            placeholder="Sales, Support, Something else"
                            {...form.register(`questions.${index}.optionsRaw`)}
                          />
                          <FieldDescription>
                            Comma separated.
                          </FieldDescription>
                        </Field>
                      )}
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove question ${index + 1}`}
                      onClick={() => questions.remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              className="mt-3"
              onClick={() =>
                questions.append({
                  label: "",
                  qtype: "text",
                  optionsRaw: "",
                  isRequired: false,
                })
              }
            >
              <Plus className="mr-1.5 h-4 w-4" /> Add question
            </Button>
          </FieldSet>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <FieldGroup>
            <Field orientation="horizontal">
              <Switch
                id="isActive"
                checked={watched.isActive ?? true}
                onCheckedChange={(checked) =>
                  form.setValue("isActive", checked)
                }
              />
              <div>
                <FieldLabel htmlFor="isActive">Accepting bookings</FieldLabel>
                <FieldDescription>
                  Turn off to take the link offline without deleting it.
                </FieldDescription>
              </div>
            </Field>

            <Field orientation="horizontal">
              <Switch
                id="isHidden"
                checked={watched.isHidden ?? false}
                onCheckedChange={(checked) =>
                  form.setValue("isHidden", checked)
                }
              />
              <div>
                <FieldLabel htmlFor="isHidden">Secret event</FieldLabel>
                <FieldDescription>
                  Hidden from your public page. Anyone with the direct link can
                  still book — this is not access control.
                </FieldDescription>
              </div>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button
          type="submit"
          className="rounded-full"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {submitLabel}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/event-types")}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}

function toFormValues(eventType: EventType): EventTypeFormValues {
  return {
    name: eventType.name,
    slug: eventType.slug,
    description: eventType.description ?? "",
    color: eventType.color,
    durationMinutes: eventType.durationMinutes,
    kind: eventType.kind,
    locationType: eventType.locationType,
    locationDetails: eventType.locationDetails ?? "",
    bufferBeforeMin: eventType.bufferBeforeMin,
    bufferAfterMin: eventType.bufferAfterMin,
    minNoticeMin: eventType.minNoticeMin,
    rollingDays: eventType.rollingDays,
    slotIncrementMin: eventType.slotIncrementMin,
    capacity: eventType.capacity,
    isActive: eventType.isActive,
    isHidden: eventType.isHidden,
    questions: (eventType.questions ?? []).map((question) => ({
      label: question.label,
      qtype: question.qtype,
      optionsRaw: (question.options ?? []).join(", "),
      isRequired: question.isRequired,
    })),
  }
}

function toApiInput(values: EventTypeFormValues): EventTypeInput {
  return {
    name: values.name,
    slug: values.slug,
    description: values.description || undefined,
    color: values.color,
    durationMinutes: values.durationMinutes,
    kind: values.kind,
    locationType: values.locationType,
    locationDetails: values.locationDetails || undefined,
    bufferBeforeMin: values.bufferBeforeMin,
    bufferAfterMin: values.bufferAfterMin,
    minNoticeMin: values.minNoticeMin,
    rollingDays: values.rollingDays,
    slotIncrementMin: values.slotIncrementMin,
    capacity: values.capacity,
    isActive: values.isActive,
    isHidden: values.isHidden,
    // Position is the array order rather than a user-managed number, so
    // reordering the list is all it takes to reorder the booking form.
    questions: values.questions.map((question, index) => ({
      label: question.label,
      qtype: question.qtype,
      options:
        question.qtype === "select"
          ? splitOptions(question.optionsRaw)
          : undefined,
      isRequired: question.isRequired,
      position: index,
    })),
  }
}

function splitOptions(raw: string | undefined): string[] | undefined {
  if (!raw) return undefined

  const options = raw
    .split(",")
    .map((option) => option.trim())
    .filter(Boolean)

  return options.length > 0 ? options : undefined
}
