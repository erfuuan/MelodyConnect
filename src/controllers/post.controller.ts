import Service from '../service/index';
import responseBuilder from '../library/responseBuilder';
import Joi from 'joi';
import Schema from '../validation/index';
import chalk from 'chalk';

export default {
  create: async (req: any, res: any) => {
    const result = Schema.postValidation.createSchema.validate(req.body);
    if (result.error) {
      return responseBuilder.badRequest(res, req.body, result.error.message);
    }
    try {
      const data = await Joi.attempt(result.value, Schema.postValidation.createSchema);
      data.authorId = req.userData._id;
      const newPost = await Service.CRUD.create('Post', data);
      return responseBuilder.created(res, newPost, 'مطلب شما با موفقیت ایجاد شد.');
    } catch (err) {
      console.log(chalk.underline.red('✖ err from catch of controller : '));
      console.log(chalk.red(err));
      console.log(chalk.underline.red('✖ err from catch of controller : '));
      return responseBuilder.internalErr(res);
    }
  },

  update: async (req: any, res: any) => {
    const result = Schema.postValidation.editSchema.validate({ ...req.body, ...req.params });
    if (result.error) {
      return responseBuilder.badRequest(res, req.body, result.error.message);
    }
    try {
      const data = await Joi.attempt(result.value, Schema.postValidation.editSchema);
      const postExist = await Service.CRUD.findById('Post', req.params.id, []);
      if (!postExist) {
        return responseBuilder.notFound(res, '', 'پست یافت نشد');
      }
      const updatedPost = await Service.CRUD.updateById(
        'Post',
        data,
        data.id,
        ['authorId', 'tagIds', 'categoryIds', 'fileIds'],
        { softDelete: 0 }
      );
      return responseBuilder.success(res, updatedPost, '.مطلب شما با موفقیت ویرایش شد');
    } catch (err) {
      console.log(chalk.underline.red('✖ err from catch of controller : '));
      console.log(chalk.red(err));
      console.log(chalk.underline.red('✖ err from catch of controller : '));
      return responseBuilder.internalErr(res);
    }
  },

  getOne: async (req: any, res: any) => {
    const result = Schema.postValidation.getOne.validate(req.params);
    if (result.error) {
      return responseBuilder.badRequest(res, req.params, result.error.message);
    }
    try {
      const { id } = await Joi.attempt(result.value, Schema.postValidation.getOne);
      const postData = await Service.CRUD.findById('Post', id, ['fileIds', 'authorId', 'tagIds']);
      if (postData.softDelete == true) {
        return responseBuilder.notFound(res, '', 'این پست حدف شده است');
      }
      delete postData.softDelete;
      return responseBuilder.success(res, postData, '');
    } catch (err) {
      console.log(chalk.underline.red('✖ err from catch of controller : '));
      console.log(chalk.red(err));
      console.log(chalk.underline.red('✖ err from catch of controller : '));
      return responseBuilder.internalErr(res);
    }
  },

  getAll: async (req: any, res: any) => {
    try {
      const posts = await Service.CRUD.getAll(
        'Post',
        { softDelete: false, authorId: req.userData._id },
        '',
        { createdAt: -1 },
        { softDelete: 0 }
      );
      if (posts.length == 0) {
        return responseBuilder.success(res, [], '');
      }
      return responseBuilder.success(res, posts, '');
    } catch (err) {
      console.log(chalk.underline.red('✖ err from catch of controller : '));
      console.log(chalk.red(err));
      console.log(chalk.underline.red('✖ err from catch of controller : '));
      return responseBuilder.internalErr(res);
    }
  },

  delete: async (req: any, res: any) => {
    const result = Schema.postValidation.getOne.validate(req.params);
    if (result.error) {
      return responseBuilder.badRequest(res, req.params, result.error.message);
    }
    try {
      const { id } = await Joi.attempt(result.value, Schema.postValidation.editSchema);
      await Service.CRUD.delete('Post', id, { softDelete: true });
      return responseBuilder.success(res, '', 'مطلب با موفقیت حذف شد');
    } catch (err) {
      console.log(chalk.underline.red('✖ err from catch of controller : '));
      console.log(chalk.red(err));
      console.log(chalk.underline.red('✖ err from catch of controller : '));
      return responseBuilder.internalErr(res);
    }
  },

  //     //======================================

  save: async (req: any, res: any) => {},
  unSave: async (req: any, res: any) => {},
  saved: async (req: any, res: any) => {},

  //     otherUserPosts: async (req:any, res:any) => {
  //         try {
  //             const posts = await Model.Post.find({ softDelete: false, authorId: req.params.userId })
  //                 // .populate('authorId')
  //                 // .populate('fileIds')
  //                 .sort({ 'createdAt': -1 })
  //                 .select({ softDelete: 0 })
  //                 .lean();
  //             if (posts.length == 0) { return responseBuilder.success(res, "", "") }
  //             return responseBuilder.success(res, posts, "")
  //         } catch (err) {
  //             console.log(err)
  //                        return responseBuilder.internal(res, "مشکلی پیش آمده است لطفا با پشتیبانی تماس بگیرید")

  //         }
  //     },

  like: async (req: any, res: any) => {},

  unLike: async (req: any, res: any) => {},

  liked: async (req: any, res: any) => {},

  usersLiked: async (req: any, res: any) => {},
};
