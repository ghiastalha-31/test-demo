const Joi = require('joi');

const itemSchema = Joi.object({
  name: Joi.string().min(2).required(),
  price: Joi.number().min(0).required(),
  category: Joi.string().required(),
});

module.exports = {
    itemSchema
}
