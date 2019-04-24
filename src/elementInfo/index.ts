import { Host } from '@readium/glue-rpc';
import { ElementInfoService } from './handler';

export default new Host('elementInfo', ElementInfoService);
