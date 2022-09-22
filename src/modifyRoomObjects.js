export default (objects) => {
  const updatedObjects = {};

  objects.forEach((obj) => {
    updatedObjects[obj._id] = obj;
    const object = updatedObjects[obj._id];

    switch (object.type) {
      case 'controller':
        if (!object.user) return;
        switch (object.level) {
          case 1:
            object.progressTotal = 200;
            break;
          case 2:
            object.progressTotal = 45000;
            break;
          case 3:
            object.progressTotal = 135000;
            break;
          case 4:
            object.progressTotal = 405000;
            break;
          case 5:
            object.progressTotal = 1215000;
            break;
          case 6:
            object.progressTotal = 3645000;
            break;
          case 7:
            object.progressTotal = 10935000;
            break;
          default:
            object.progressTotal = 0;
            break;
        }
        break;
      case 'creep': {
        const countPerType = {};
        if (!object.body) return;
        const body = object.body.map((p) => p.type);
        for (let p = 0; p < body.length; p += 1) {
          const part = body[p];
          if (!countPerType[part]) countPerType[part] = 0;
          countPerType[part] += 1;
        }

        object.body = countPerType;
        break;
      }
      default:
        break;
    }
  });
  return updatedObjects;
};
