// Same imports remain unchanged
// Code inside function starts here

return (
  <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
    <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto space-y-6">
      <DialogHeader>
        <DialogTitle className="text-xl">
          {initialData ? "Edit Job" : "Create New Job"}
        </DialogTitle>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">Job Title*</FormLabel>
                <FormControl>
                  <Input placeholder="Enter job title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="client_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">Client*</FormLabel>
                <FormControl>
                  <ClientSelector value={field.value} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">Description</FormLabel>
                <FormControl>
                  <Textarea placeholder="Enter job description" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    Location
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Job location" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-sm text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    Cost
                  </FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g. 100" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormItem>
              <FormLabel className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarIcon className="h-4 w-4" />
                Date
              </FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </FormItem>

            <FormField
              control={form.control}
              name="scheduled_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    Time
                  </FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Duration (hours)
                </FormLabel>
                <FormControl>
                  <Input type="text" placeholder="e.g. 2, 2.5" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormItem>
            <FormLabel className="flex items-center gap-2 text-sm text-muted-foreground">
              <Image className="h-4 w-4" />
              Photos
            </FormLabel>
            <div className="space-y-3">
              <FormControl>
                <label className="cursor-pointer">
                  <div className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-md p-6 hover:border-primary">
                    <div className="text-center">
                      <Plus className="mx-auto h-6 w-6 text-muted-foreground" />
                      <span className="mt-2 block text-sm font-medium text-muted-foreground">
                        Add photos
                      </span>
                    </div>
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </div>
                </label>
              </FormControl>

              {imagePreviewUrls.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">New Photos</p>
                  <div className="grid grid-cols-4 gap-2">
                    {imagePreviewUrls.map((url, index) => (
                      <Avatar key={index} className="h-16 w-16 rounded-md">
                        <AvatarImage src={url} alt={`Preview ${index}`} className="object-cover" />
                        <AvatarFallback className="rounded-md">IMG</AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                </div>
              )}

              {existingPhotos.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Existing Photos</p>
                  <div className="grid grid-cols-4 gap-2">
                    {existingPhotos.map((photo, index) => (
                      <Avatar key={index} className="h-16 w-16 rounded-md">
                        <AvatarImage
                          src={getPhotoUrl(initialData.id, photo.name)}
                          alt={`Job Photo ${index}`}
                          className="object-cover"
                        />
                        <AvatarFallback className="rounded-md">IMG</AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </FormItem>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : initialData ? "Update Job" : "Create Job"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  </Dialog>
);
