import json

from waflib.Configure import conf


@conf
def configure_appinfo(ctx, transforms):
    for transform in transforms:
        transform(ctx.env.PROJECT_INFO)
