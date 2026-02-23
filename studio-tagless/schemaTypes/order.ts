import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'order',
  title: 'Order',
  type: 'document',
  fields: [
    defineField({
      name: 'customerName',
      title: 'Customer Name',
      type: 'string',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'phone',
      title: 'Phone Number',
      type: 'string',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'address',
      title: 'Address',
      type: 'text',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'items',
      title: 'Items',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'productId',
              title: 'Product ID',
              type: 'string',
              validation: Rule => Rule.required()
            },
            {
              name: 'productTitle',
              title: 'Product Title',
              type: 'string'
            },
            {
              name: 'quantity',
              title: 'Quantity',
              type: 'number',
              validation: Rule => Rule.required().min(1)
            },
            {
              name: 'selectedColor',
              title: 'Selected Color',
              type: 'string'
            },
            {
              name: 'selectedSize',
              title: 'Selected Size',  // NEW: Size field
              type: 'string'
            },
            {
              name: 'price',
              title: 'Price',
              type: 'number'
            }
          ]
        }
      ],
      validation: Rule => Rule.required().min(1)
    }),
    defineField({
      name: 'total',
      title: 'Total',
      type: 'number',
      validation: Rule => Rule.required().min(0)
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: 'Pending', value: 'Pending' },
          { title: 'Shipped', value: 'Shipped' },
          { title: 'Done', value: 'Done' }
        ],
        layout: 'radio'
      },
      initialValue: 'Pending'
    }),
  ]
})