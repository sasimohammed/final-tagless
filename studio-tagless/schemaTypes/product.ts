// schemas/product.ts
import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'product',
  title: 'Product',
  type: 'document',
  fields: [
    // Product Name
    defineField({
      name: 'title',
      title: 'Product Name',
      type: 'string',
      validation: Rule => Rule.required()
    }),

    // Slug (URL)
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: Rule => Rule.required()
    }),

    // Price
    defineField({
      name: 'price',
      title: 'Price',
      type: 'number',
      validation: Rule => Rule.required().min(0)
    }),

    // Available Stock
    defineField({
      name: 'stock',
      title: 'Stock',
      type: 'number',
      validation: Rule => Rule.required().min(0)
    }),

    // Available Colors
    defineField({
      name: 'colors',
      title: 'Available Colors',
      type: 'array',
      of: [
        {
          type: 'string'
        }
      ]
    }),

    // Available Sizes (free text input)
    defineField({
      name: 'sizes',
      title: 'Available Sizes',
      type: 'array',
      of: [
        {
          type: 'string'
        }
      ],
      description: 'Enter any size (e.g., S, M, L, XL, 40, 42, One Size, etc.)'
    }),

    // Multiple Product Images (NEW - replaces old single image)
    defineField({
      name: 'images',
      title: 'Product Images',
      type: 'array',
      of: [
        {
          type: 'image',
          options: {
            hotspot: true, // Allows cropping and focal point selection
          },
          fields: [
            {
              name: 'alt',
              title: 'Alternative Text',
              type: 'string',
              description: 'Important for SEO and accessibility'
            },
            {
              name: 'caption',
              title: 'Caption',
              type: 'string'
            }
          ]
        }
      ],
      options: {
        layout: 'grid', // Display images in a grid layout
        sortable: true, // Allow reordering images
      },
      validation: Rule => Rule.min(1).error('At least one image is required')
    }),

    // Description
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text'
    }),
  ],
})