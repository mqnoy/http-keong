import 'reflect-metadata';
import { ApiProperty, SWAGGER_SCHEMA_REGISTRY, ApiOperation, ApiDocResponse, ApiBody } from '../decorators/swagger';
import { METADATA_KEYS } from '../core/metadata';

describe('Swagger Decorators', () => {
  beforeEach(() => {
    // Clear registry before each test
    for (const key in SWAGGER_SCHEMA_REGISTRY) {
      delete SWAGGER_SCHEMA_REGISTRY[key];
    }
  });

  describe('ApiProperty', () => {
    it('should register properties in the global schema registry', () => {
      // Arrange
      class TestDto {
        @ApiProperty({ description: 'The name' })
        name!: string;

        @ApiProperty({ example: 25 })
        age!: number;
      }
      // Use the class to avoid unused variable error
      expect(TestDto).toBeDefined();

      // Act
      const schema = SWAGGER_SCHEMA_REGISTRY['TestDto'];

      // Assert
      expect(schema).toBeDefined();
      expect(schema.type).toBe('object');
      expect(schema.properties.name).toEqual({
        type: 'string',
        description: 'The name',
        example: undefined,
        enum: undefined,
      });
      expect(schema.properties.age).toEqual({
        type: 'number',
        description: undefined,
        example: 25,
        enum: undefined,
      });
    });

    it('should handle required properties', () => {
      // Arrange
      class RequiredDto {
        @ApiProperty({ required: true })
        id!: string;
      }
      expect(RequiredDto).toBeDefined();

      // Act
      const schema = SWAGGER_SCHEMA_REGISTRY['RequiredDto'];

      // Assert
      expect(schema.required).toContain('id');
    });

    it('should handle nested DTOs', () => {
      // Arrange
      class ChildDto {
        @ApiProperty()
        name!: string;
      }

      class ParentDto {
        @ApiProperty({ type: ChildDto })
        child!: ChildDto;
      }
      expect(ParentDto).toBeDefined();

      // Act
      const schema = SWAGGER_SCHEMA_REGISTRY['ParentDto'];

      // Assert
      expect(schema.properties.child).toEqual({
        $ref: '#/components/schemas/ChildDto',
      });
    });
  });

  describe('ApiOperation', () => {
    it('should attach operation metadata to the method', () => {
      // Arrange
      class TestController {
        @ApiOperation({ summary: 'Test summary' })
        test() {}
      }

      // Act
      const metadata = Reflect.getMetadata(METADATA_KEYS.SWAGGER_DOCS, TestController, 'test');

      // Assert
      expect(metadata).toEqual({ summary: 'Test summary' });
    });
  });

  describe('ApiDocResponse', () => {
    it('should attach response metadata with type reference', () => {
      // Arrange
      class UserDto {
        @ApiProperty()
        id!: number;
      }

      class TestController {
        @ApiDocResponse(200, { description: 'Success', type: UserDto })
        test() {}
      }

      // Act
      const metadata = Reflect.getMetadata(METADATA_KEYS.SWAGGER_DOCS, TestController, 'test');

      // Assert
      expect(metadata.responses['200']).toEqual({
        description: 'Success',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/UserDto' },
          },
        },
      });
    });

    it('should support array of DTOs', () => {
      // Arrange
      class UserDto {
        @ApiProperty() id!: number;
      }
      class TestController {
        @ApiDocResponse(200, { type: [UserDto] })
        test() {}
      }

      // Act
      const metadata = Reflect.getMetadata(METADATA_KEYS.SWAGGER_DOCS, TestController, 'test');

      // Assert
      expect(metadata.responses['200'].content['application/json'].schema).toEqual({
        type: 'array',
        items: { $ref: '#/components/schemas/UserDto' },
      });
    });
  });

  describe('ApiBody', () => {
    it('should attach requestBody metadata', () => {
      // Arrange
      class CreateDto {
        @ApiProperty() name!: string;
      }
      class TestController {
        @ApiBody({ type: CreateDto, description: 'User input' })
        test() {}
      }

      // Act
      const metadata = Reflect.getMetadata(METADATA_KEYS.SWAGGER_DOCS, TestController, 'test');

      // Assert
      expect(metadata.requestBody).toBeDefined();
      expect(metadata.requestBody.content['application/json'].schema).toEqual({
        $ref: '#/components/schemas/CreateDto',
      });
    });
  });
});
